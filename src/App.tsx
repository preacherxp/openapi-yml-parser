import React, { useState, useCallback } from 'react'
import { load, dump } from 'js-yaml'
import { FileUp, FileCode, Download } from 'lucide-react'
import TreeView from './components/TreeView'
import { Button } from './components/ui/button'
import exampleYaml from './example-openapi.yaml?raw'

function App() {
  const [yamlContent, setYamlContent] = useState<any>(null)
  const [selectedPaths, setSelectedPaths] = useState<string[]>([])

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string
          const parsedYaml = load(content)
          setYamlContent(parsedYaml)
        } catch (error) {
          console.error('Error parsing YAML:', error)
          alert('Error parsing YAML file. Please check the file format.')
        }
      }
      reader.readAsText(file)
    }
  }, [])

  const loadExampleYaml = useCallback(() => {
    try {
      const parsedYaml = load(exampleYaml)
      setYamlContent(parsedYaml)
    } catch (error) {
      console.error('Error parsing example YAML:', error)
      alert('Error parsing example YAML file.')
    }
  }, [])

  const handleSelect = useCallback((path: string, isSelected: boolean) => {
    setSelectedPaths(prev => {
      if (isSelected) {
        return [...prev, path]
      } else {
        return prev.filter(p => p !== path && !p.startsWith(`${path}.`))
      }
    })
  }, [])

  const exportSelectedPaths = useCallback(() => {
    if (!yamlContent || selectedPaths.length === 0) {
      alert('Please select at least one path to export.')
      return
    }

    const selectedData: any = {}
    selectedPaths.forEach(path => {
      const keys = path.split('.')
      let current = yamlContent
      let target = selectedData
      keys.forEach((key, index) => {
        if (index === keys.length - 1) {
          target[key] = current[key]
        } else {
          current = current[key]
          target[key] = target[key] || {}
          target = target[key]
        }
      })
    })

    const exportYaml = dump(selectedData)
    const blob = new Blob([exportYaml], { type: 'text/yaml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'exported_openapi.yaml'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [yamlContent, selectedPaths])

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <h1 className="text-3xl font-bold mb-6 text-center">Parsley - OpenAPI YAML Parser</h1>
      <div className="max-w-4xl mx-auto bg-card rounded-lg shadow-md p-6">
        <div className="flex justify-center space-x-4 mb-6">
          <Button asChild>
            <label htmlFor="file-upload" className="cursor-pointer">
              <FileUp className="w-5 h-5 mr-2" />
              Upload YAML File
              <input
                id="file-upload"
                name="file-upload"
                type="file"
                className="hidden"
                accept=".yaml,.yml"
                onChange={handleFileUpload}
              />
            </label>
          </Button>
          <Button onClick={loadExampleYaml} variant="secondary">
            <FileCode className="w-5 h-5 mr-2" />
            Load Example YAML
          </Button>
          <Button
            onClick={exportSelectedPaths}
            variant="outline"
            disabled={!yamlContent || selectedPaths.length === 0}
          >
            <Download className="w-5 h-5 mr-2" />
            Export Selected
          </Button>
        </div>
        {yamlContent && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">OpenAPI Specification Tree</h2>
            <TreeView 
              data={yamlContent} 
              onSelect={handleSelect}
              selectedPaths={selectedPaths}
            />
          </div>
        )}
        {selectedPaths.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">Selected Paths</h2>
            <ul className="list-disc list-inside">
              {selectedPaths.map((path, index) => (
                <li key={index} className="text-muted-foreground">{path}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

export default App