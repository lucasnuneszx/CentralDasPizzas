'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Upload, X, Image as ImageIcon } from 'lucide-react'

interface ImageUploadProps {
  onImageSelect: (file: File) => void
  currentImage?: string
  className?: string
}

export function ImageUpload({ onImageSelect, currentImage, className = '' }: ImageUploadProps) {
  const [dragActive, setDragActive] = useState(false)
  const [preview, setPreview] = useState<string | null>(currentImage || null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Atualizar preview quando currentImage mudar
  useEffect(() => {
    setPreview(currentImage || null)
  }, [currentImage])

  const handleFiles = (files: FileList | null) => {
    if (files && files[0]) {
      const file = files[0]
      
      // Validar tipo de arquivo
      if (!file.type.startsWith('image/')) {
        alert('Por favor, selecione apenas arquivos de imagem.')
        return
      }

      // Validar tamanho (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('A imagem deve ter no máximo 5MB.')
        return
      }

      // Criar preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)

      // Chamar callback
      onImageSelect(file)
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files)
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files)
  }

  const removeImage = (e: React.MouseEvent) => {
    e.stopPropagation()
    setPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    // Criar um File vazio para notificar o componente pai
    const emptyFile = new File([], '', { type: 'image/png' })
    onImageSelect(emptyFile)
  }

  const openFileDialog = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className={`w-full ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInput}
        className="hidden"
      />
      
      <Card
        className={`relative border-2 border-dashed transition-all duration-200 cursor-pointer ${
          dragActive 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        <div className="p-6 text-center">
          {preview ? (
            <div className="relative">
              <img
                src={preview}
                alt="Preview"
                className="w-full h-48 object-cover rounded-lg"
              />
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2"
                onClick={removeImage}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-4">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                <ImageIcon className="w-8 h-8 text-gray-400" />
              </div>
              <div>
                <p className="text-lg font-medium text-gray-900">
                  Clique para escolher uma imagem
                </p>
                <p className="text-sm text-gray-500">
                  ou arraste e solte aqui
                </p>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Upload className="w-4 h-4" />
                <span>PNG, JPG, GIF até 5MB</span>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}


