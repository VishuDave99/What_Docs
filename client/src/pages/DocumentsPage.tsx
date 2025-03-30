import React, { useRef } from 'react';
import { useDocuments } from '@/hooks/useDocuments';
import { formatFileSize, formatRelativeTime, getFileIcon } from '@/utils/formatters';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Loader2, UploadCloud, Plus, Trash2, X, FolderOpen, CheckSquare } from 'lucide-react';

export default function DocumentsPage() {
  const {
    selectedDocuments,
    availableDocuments,
    isLoading,
    isUploading,
    fileInputRef,
    openFileDialog,
    handleFileSelect,
    deleteDocument,
    selectDocument,
    unselectDocument
  } = useDocuments();
  
  const deleteConfirmRef = useRef<any>(null);
  const [documentToDelete, setDocumentToDelete] = React.useState<number | null>(null);
  
  const handleDeleteConfirm = (id: number) => {
    setDocumentToDelete(id);
    if (deleteConfirmRef.current) {
      deleteConfirmRef.current.click();
    }
  };
  
  const handleConfirmedDelete = async () => {
    if (documentToDelete !== null) {
      await deleteDocument(documentToDelete);
      setDocumentToDelete(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <header style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-color)' }} 
        className="p-4 border-b">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h2 style={{ color: 'var(--text-accent)' }} className="font-medium text-xl">
            Document Management
          </h2>
          
          <button 
            style={{ 
              backgroundColor: 'var(--primary-color)', 
              color: 'white'
            }}
            className="px-4 py-2 rounded-lg flex items-center transition-all duration-200 hover:shadow-lg"
            onClick={openFileDialog}
            disabled={isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 className="animate-spin mr-2" size={18} />
                <span className="ml-2">Uploading...</span>
              </>
            ) : (
              <>
                <UploadCloud size={18} className="mr-2" />
                <span>Upload Document</span>
              </>
            )}
          </button>
            
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileSelect} 
            className="hidden" 
            accept=".pdf,.txt,.doc,.docx,.md,.rtf,.csv,.xlsx,.xls,.ppt,.pptx"
          />
        </div>
      </header>
      
      {/* Content */}
      <div style={{ backgroundColor: 'var(--bg-secondary)' }} className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="max-w-6xl mx-auto">
          {/* Selected documents section */}
          <div className="mb-10">
            <h3 style={{ color: 'var(--text-primary)' }} className="text-lg font-medium mb-4 flex items-center">
              <CheckSquare size={20} className="mr-2" style={{ color: 'var(--success-color)' }} />
              Selected Documents
            </h3>
            
            {selectedDocuments.length === 0 ? (
              <div style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }} 
                className="document-card p-6 rounded-lg border text-center">
                <p style={{ color: 'var(--text-secondary)' }}>
                  No documents selected. Select documents below to use in chat.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {selectedDocuments.map((doc) => (
                  <div key={doc.id} style={{ 
                    backgroundColor: 'var(--card-bg)', 
                    borderColor: 'var(--primary-color)', 
                    boxShadow: 'var(--shadow-sm)'
                  }} className="document-card p-4 rounded-lg border-2 border-opacity-40">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center">
                        <div style={{ color: 'var(--primary-color)' }} className="mr-2">
                          <FolderOpen size={18} />
                        </div>
                        <span style={{ color: 'var(--text-primary)' }} className="font-medium truncate max-w-[150px]">{doc.filename}</span>
                      </div>
                      <div className="flex">
                        <button 
                          style={{ color: 'var(--text-muted)' }} 
                          className="p-1 hover:opacity-80" 
                          onClick={() => unselectDocument(doc.id)}
                        >
                          <X size={16} style={{ color: 'var(--error-color)' }} />
                        </button>
                      </div>
                    </div>
                    <div style={{ color: 'var(--text-muted)' }} className="text-xs mt-2 flex justify-between">
                      <span>{formatFileSize(doc.filesize)}</span>
                      <span>{formatRelativeTime(doc.uploadDate)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Available documents section */}
          <div>
            <h3 style={{ color: 'var(--text-primary)' }} className="text-lg font-medium mb-4 flex items-center">
              <FolderOpen size={20} className="mr-2" style={{ color: 'var(--text-muted)' }} />
              Available Documents
            </h3>
            
            {isLoading ? (
              <div style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }} 
                className="document-card p-6 rounded-lg border text-center">
                <Loader2 className="animate-spin mx-auto" size={32} />
                <p style={{ color: 'var(--text-secondary)' }} className="mt-4">Loading documents...</p>
              </div>
            ) : availableDocuments.length === 0 ? (
              <div style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }} 
                className="document-card p-6 rounded-lg border text-center">
                <p style={{ color: 'var(--text-secondary)' }}>
                  No documents available. Upload documents to get started.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {availableDocuments.map((doc) => (
                  <div key={doc.id}
                    className="document-card p-4 rounded-lg border"
                    style={{ 
                      backgroundColor: 'var(--card-bg)', 
                      borderColor: 'var(--border-color)',
                      boxShadow: 'var(--shadow-sm)'
                    }}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center">
                        <div style={{ color: 'var(--text-muted)' }} className="mr-2">
                          <FolderOpen size={18} />
                        </div>
                        <span style={{ color: 'var(--text-primary)' }} className="font-medium truncate max-w-[150px]">{doc.filename}</span>
                      </div>
                      <div className="flex space-x-1">
                        <button 
                          style={{ color: 'var(--text-muted)' }}
                          className="p-1 relative group" 
                          onClick={() => selectDocument(doc.id)}
                        >
                          <Plus size={16} className="group-hover:text-primary-light transition-colors" 
                            style={{ color: 'var(--primary-color)' }} />
                          <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 px-2 py-1 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity"
                            style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                            Add to selection
                          </span>
                        </button>
                        <button 
                          style={{ color: 'var(--text-muted)' }}
                          className="p-1 relative group" 
                          onClick={() => handleDeleteConfirm(doc.id)}
                        >
                          <Trash2 size={16} className="group-hover:text-error-color transition-colors" 
                            style={{ color: 'var(--error-color)' }} />
                          <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 px-2 py-1 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity"
                            style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                            Delete document
                          </span>
                        </button>
                      </div>
                    </div>
                    <div style={{ color: 'var(--text-muted)' }} className="text-xs mt-2 flex justify-between">
                      <span>{formatFileSize(doc.filesize)}</span>
                      <span>{formatRelativeTime(doc.uploadDate)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Delete confirmation dialog */}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <button ref={deleteConfirmRef} className="hidden">Open</button>
        </AlertDialogTrigger>
        <AlertDialogContent style={{ backgroundColor: 'var(--card-bg)', color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}>
          <AlertDialogHeader>
            <AlertDialogTitle style={{ color: 'var(--text-accent)' }}>Delete Document</AlertDialogTitle>
            <AlertDialogDescription style={{ color: 'var(--text-secondary)' }}>
              Are you sure you want to delete this document? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              style={{ backgroundColor: 'var(--bg-accent)', color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmedDelete} 
              style={{ backgroundColor: 'var(--error-color)', color: 'white' }}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}