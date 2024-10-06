import React, { useState, useCallback, useEffect } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Checkbox } from './ui/checkbox';
import { cn } from '../lib/utils';

interface TreeViewProps {
  data: any;
  level?: number;
  expandedSections?: string[];
  onSelect: (path: string, isSelected: boolean) => void;
  parentPath?: string;
  selectedPaths: string[];
}

const TreeView: React.FC<TreeViewProps> = ({
  data,
  level = 0,
  expandedSections = ['paths', 'components', 'schemas'],
  onSelect,
  parentPath = '',
  selectedPaths,
}) => {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(() => {
    const initialState: Record<string, boolean> = {};
    Object.keys(data).forEach((key) => {
      initialState[key] = !expandedSections.includes(key.toLowerCase());
    });
    return initialState;
  });

  const toggleCollapse = useCallback((key: string) => {
    setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const isParentSelected = useCallback((path: string) => {
    return selectedPaths.some(selectedPath => selectedPath.startsWith(path));
  }, [selectedPaths]);

  const selectAllChildren = useCallback((obj: any, path: string, isSelected: boolean) => {
    Object.keys(obj).forEach(key => {
      const fullPath = `${path}${key}`;
      onSelect(fullPath, isSelected);
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        selectAllChildren(obj[key], `${fullPath}.`, isSelected);
      }
    });
  }, [onSelect]);

  const handleSelect = useCallback(
    (key: string, isObject: boolean) => {
      const fullPath = `${parentPath}${key}`;
      const isSelected = !selectedPaths.includes(fullPath);

      onSelect(fullPath, isSelected);

      if (isObject) {
        selectAllChildren(data[key], `${fullPath}.`, isSelected);
      }

      // Select all parent paths
      if (isSelected) {
        const pathParts = fullPath.split('.');
        for (let i = 1; i < pathParts.length; i++) {
          const parentPath = pathParts.slice(0, i).join('.');
          if (!selectedPaths.includes(parentPath)) {
            onSelect(parentPath, true);
          }
        }
      }
    },
    [onSelect, parentPath, selectedPaths, data, selectAllChildren]
  );

  const renderValue = useCallback(
    (value: any, key: string): JSX.Element => {
      if (typeof value === 'object' && value !== null) {
        return (
          <TreeView
            data={value}
            level={level + 1}
            expandedSections={expandedSections}
            onSelect={onSelect}
            parentPath={`${parentPath}${key}.`}
            selectedPaths={selectedPaths}
          />
        );
      }
      return <span className="text-muted-foreground">{String(value)}</span>;
    },
    [level, expandedSections, onSelect, parentPath, selectedPaths]
  );

  return (
    <div style={{ marginLeft: `${level * 20}px` }}>
      {Object.entries(data).map(([key, value]) => {
        const fullPath = `${parentPath}${key}`;
        const isSelected = selectedPaths.includes(fullPath) || isParentSelected(fullPath);
        const isObject = typeof value === 'object' && value !== null;
        return (
          <div key={key} className="my-1">
            <div className="flex items-center">
              <Checkbox
                id={fullPath}
                checked={isSelected}
                onCheckedChange={() => handleSelect(key, isObject)}
                className="mr-2"
              />
              {isObject ? (
                <button
                  onClick={() => toggleCollapse(key)}
                  className={cn(
                    'flex items-center text-foreground hover:text-primary focus:outline-none',
                    collapsed[key] ? 'text-muted-foreground' : 'text-foreground'
                  )}
                >
                  {collapsed[key] ? (
                    <ChevronRight className="w-4 h-4 mr-1" />
                  ) : (
                    <ChevronDown className="w-4 h-4 mr-1" />
                  )}
                  <span className="font-medium">{key}:</span>
                </button>
              ) : (
                <div className="flex items-center">
                  <span className="font-medium text-foreground mr-2">
                    {key}:
                  </span>
                  {renderValue(value, key)}
                </div>
              )}
            </div>
            {isObject && !collapsed[key] && renderValue(value, key)}
          </div>
        );
      })}
    </div>
  );
};

export default React.memo(TreeView);