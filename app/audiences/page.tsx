'use client'

import { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'
import { 
  Plus, 
  Users, 
  Upload, 
  Download, 
  Trash2, 
  Eye,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Audience, Contact } from '@/lib/types'
import { formatDate, formatNumber } from '@/lib/utils'
import toast from 'react-hot-toast'
import Papa from 'papaparse'

export default function AudiencesPage() {
  const [audiences, setAudiences] = useState<Audience[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [showContactsModal, setShowContactsModal] = useState(false)
  const [selectedAudience, setSelectedAudience] = useState<Audience | null>(null)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [newAudience, setNewAudience] = useState({
    name: '',
    description: ''
  })
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importPreview, setImportPreview] = useState<any[]>([])

  useEffect(() => {
    loadAudiences()
  }, [])

  const loadAudiences = async () => {
    try {
      const { data, error } = await supabase
        .from('audiences')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setAudiences(data || [])
    } catch (error) {
      console.error('Erro ao carregar audiências:', error)
      toast.error('Erro ao carregar audiências')
    } finally {
      setLoading(false)
    }
  }

  const createAudience = async () => {
    if (!newAudience.name) {
      toast.error('Nome da audiência é obrigatório')
      return
    }

    try {
      const { error } = await supabase
        .from('audiences')
        .insert([{
          name: newAudience.name,
          description: newAudience.description,
          total_contacts: 0,
          active_contacts: 0
        }])

      if (error) throw error

      toast.success('Audiência criada com sucesso!')
      setShowCreateModal(false)
      setNewAudience({ name: '', description: '' })
      loadAudiences()
    } catch (error) {
      console.error('Erro ao criar audiência:', error)
      toast.error('Erro ao criar audiência')
    }
  }

  const deleteAudience = async (audience: Audience) => {
    if (!confirm(`Tem certeza que deseja excluir a audiência "${audience.name}"?`)) return

    try {
      const { error } = await supabase
        .from('audiences')
        .delete()
        .eq('id', audience.id)

      if (error) throw error

      toast.success('Audiência excluída!')
      loadAudiences()
    } catch (error) {
      console.error('Erro ao excluir audiência:', error)
      toast.error('Erro ao excluir audiência')
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setImportFile(file)

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setImportPreview(results.data.slice(0, 5)) // Mostrar apenas 5 primeiras linhas
      },
      error: (error) => {
        toast.error('Erro ao ler arquivo CSV')
        console.error(error)
      }
    })
  }

  const importContacts = async () => {
    if (!importFile || !selectedAudience) return

    const loadingToast = toast.loading('Importando contatos...')

    try {
      Papa.parse(importFile, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          const contacts = results.data as any[]
          const validContacts = contacts.filter(contact => 
            contact.Nome && contact.Telefone
          )

          if (validContacts.length === 0) {
            toast.error('Nenhum contato válido encontrado')
            return
          }

          // Inserir contatos no banco
          const contactsToInsert = validContacts.map(contact => ({
            audience_id: selectedAudience.id,
            name: contact.Nome,
            phone: contact.Telefone.replace(/\D/g, ''),
            tag: contact.Etiqueta || null,
            status: contact.Status === 'Desativado' ? 'inactive' : 'active',
            observations: contact.Observacoes || null
          }))

          const { error } = await supabase
            .from('contacts')
            .insert(contactsToInsert)

          if (error) throw error

          // Atualizar contadores da audiência
          await updateAudienceCounters(selectedAudience.id)

          toast.dismiss(loadingToast)
          toast.success(`${validContacts.length} contatos importados com sucesso!`)
          setShowImportModal(false)
          setImportFile(null)
          setImportPreview([])
          loadAudiences()

          // Verificar WhatsApp dos contatos
          verifyWhatsAppContacts(selectedAudience.id)
        }
      })
    } catch (error) {
      toast.dismiss(loadingToast)
      console.error('Erro ao importar contatos:', error)
      toast.error('Erro ao importar contatos')
    }
  }

  const verifyWhatsAppContacts = async (audienceId: string) => {
    toast.loading('Verificando WhatsApp dos contatos...', { duration: 3000 })
    
    try {
      const response = await fetch('/api/contacts/verify-whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audienceId })
      })

      if (!response.ok) throw new Error('Erro na verificação')

      const result = await response.json()
      toast.success(`Verificação concluída! ${result.verified} contatos verificados`)
      loadAudiences()
    } catch (error) {
      console.error('Erro na verificação:', error)
      toast.error('Erro ao verificar WhatsApp')
    }
  }

  const updateAudienceCounters = async (audienceId: string) => {
    const { data: contacts } = await supabase
      .from('contacts')
      .select('status')
      .eq('audience_id', audienceId)

    if (!contacts) return

    const totalContacts = contacts.length
    const activeContacts = contacts.filter(c => c.status === 'active').length

    await supabase
      .from('audiences')
      .update({
        total_contacts: totalContacts,
        active_contacts: activeContacts
      })
      .eq('id', audienceId)
  }

  const loadContacts = async (audience: Audience) => {
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('audience_id', audience.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setContacts(data || [])
      setSelectedAudience(audience)
      setShowContactsModal(true)
    } catch (error) {
      console.error('Erro ao carregar contatos:', error)
      toast.error('Erro ao carregar contatos')
    }
  }

  const downloadExampleFile = () => {
    const exampleData = [
      {
        'Nome': 'João Silva',
        'Telefone': '5511999999999',
        'Etiqueta': 'Cliente VIP',
        'Status': 'Ativo',
        'Observações': 'Cliente desde 2020'
      },
      {
        'Nome': 'Maria Santos',
        'Telefone': '5511888888888',
        'Etiqueta': 'Prospect',
        'Status': 'Ativo',
        'Observações': 'Interessada em produtos premium'
      }
    ]

    const csv = Papa.unparse(exampleData)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    
    link.setAttribute('href', url)
    link.setAttribute('download', 'exemplo_audiencia.csv')
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast.success('Arquivo de exemplo baixado!')
  }

  const exportContacts = async (audience: Audience) => {
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('audience_id', audience.id)

      if (error) throw error

      // Se não há contatos, criar arquivo com apenas os cabeçalhos
      const csvData = data && data.length > 0 
        ? data.map(contact => ({
            'Nome': contact.name,
            'Telefone': contact.phone,
            'Etiqueta': contact.tag || '',
            'Status': contact.status === 'active' ? 'Ativo' : 'Desativado',
            'Observações': contact.observations || ''
          }))
        : [{ // Arquivo vazio com cabeçalhos
            'Nome': '',
            'Telefone': '',
            'Etiqueta': '',
            'Status': '',
            'Observações': ''
          }]

      const csv = Papa.unparse(csvData)
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      
      link.setAttribute('href', url)
      link.setAttribute('download', `audiencia_${audience.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      const message = data && data.length > 0 
        ? 'Audiência exportada com sucesso!'
        : 'Arquivo modelo exportado (audiência vazia)'
      
      toast.success(message)
    } catch (error) {
      console.error('Erro ao exportar:', error)
      toast.error('Erro ao exportar audiência')
    }
  }

  if (loading) {
    return (
      <div className="flex">
        <Sidebar />
        <div className="flex-1 p-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="card p-6">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Audiências</h1>
            <p className="text-gray-600 mt-2">Gerencie suas listas de contatos</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={downloadExampleFile}
              className="btn btn-secondary"
            >
              <Download className="h-5 w-5 mr-2" />
              Baixar Exemplo
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn btn-primary"
            >
              <Plus className="h-5 w-5 mr-2" />
              Nova Audiência
            </button>
          </div>
        </div>

        {audiences.length === 0 ? (
          <div className="card p-12 text-center">
            <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Nenhuma audiência encontrada</h3>
            <p className="text-gray-600 mb-6">Crie sua primeira audiência para começar</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn btn-primary"
            >
              <Plus className="h-5 w-5 mr-2" />
              Criar Primeira Audiência
            </button>
          </div>
        ) : (
          <div className="grid gap-6">
            {audiences.map((audience) => (
              <div key={audience.id} className="card p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-success-50 rounded-lg">
                      <Users className="h-6 w-6 text-success-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{audience.name}</h3>
                      <p className="text-sm text-gray-600">{audience.description}</p>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className="text-xs text-gray-500">
                          {formatNumber(audience.total_contacts)} contatos
                        </span>
                        <span className="text-xs text-success-600">
                          {formatNumber(audience.active_contacts)} ativos
                        </span>
                        <span className="text-xs text-gray-500">
                          Criado em {formatDate(audience.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setSelectedAudience(audience)
                        setShowImportModal(true)
                      }}
                      className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                      title="Importar Contatos"
                    >
                      <Upload className="h-5 w-5" />
                    </button>

                    <button
                      onClick={() => exportContacts(audience)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Exportar"
                    >
                      <Download className="h-5 w-5" />
                    </button>

                    <button
                      onClick={() => loadContacts(audience)}
                      className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                      title="Ver Contatos"
                    >
                      <Eye className="h-5 w-5" />
                    </button>

                    <button
                      onClick={() => deleteAudience(audience)}
                      className="p-2 text-error-600 hover:bg-error-50 rounded-lg transition-colors"
                      title="Excluir"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal de Criar Audiência */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Nova Audiência</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome da Audiência
                  </label>
                  <input
                    type="text"
                    className="input"
                    placeholder="Ex: Clientes VIP"
                    value={newAudience.name}
                    onChange={(e) => setNewAudience({ ...newAudience, name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descrição (opcional)
                  </label>
                  <textarea
                    className="textarea"
                    placeholder="Descrição da audiência..."
                    value={newAudience.description}
                    onChange={(e) => setNewAudience({ ...newAudience, description: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="btn btn-secondary"
                >
                  Cancelar
                </button>
                <button
                  onClick={createAudience}
                  className="btn btn-primary"
                >
                  Criar Audiência
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Importar Contatos */}
        {showImportModal && selectedAudience && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Importar Contatos - {selectedAudience.name}
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Arquivo CSV
                  </label>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="input"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Formato: Nome, Telefone, Etiqueta, Status, Observacoes
                  </p>
                </div>

                {importPreview.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Prévia (5 primeiros registros)</h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-xs">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="px-2 py-1 text-left">Nome</th>
                            <th className="px-2 py-1 text-left">Telefone</th>
                            <th className="px-2 py-1 text-left">Etiqueta</th>
                            <th className="px-2 py-1 text-left">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {importPreview.map((row: any, index) => (
                            <tr key={index} className="border-t">
                              <td className="px-2 py-1">{row.Nome}</td>
                              <td className="px-2 py-1">{row.Telefone}</td>
                              <td className="px-2 py-1">{row.Etiqueta}</td>
                              <td className="px-2 py-1">{row.Status}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowImportModal(false)
                    setImportFile(null)
                    setImportPreview([])
                  }}
                  className="btn btn-secondary"
                >
                  Cancelar
                </button>
                <button
                  onClick={importContacts}
                  disabled={!importFile}
                  className="btn btn-primary disabled:opacity-50"
                >
                  Importar Contatos
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Ver Contatos */}
        {showContactsModal && selectedAudience && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  Contatos - {selectedAudience.name}
                </h2>
                <button
                  onClick={() => setShowContactsModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              
              {contacts.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Nenhum contato encontrado</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-4 py-2 text-left">Nome</th>
                        <th className="px-4 py-2 text-left">Telefone</th>
                        <th className="px-4 py-2 text-left">WhatsApp</th>
                        <th className="px-4 py-2 text-left">Status</th>
                        <th className="px-4 py-2 text-left">Etiqueta</th>
                      </tr>
                    </thead>
                    <tbody>
                      {contacts.map((contact) => (
                        <tr key={contact.id} className="border-t">
                          <td className="px-4 py-2">
                            <div>
                              <div className="font-medium">{contact.name}</div>
                              {contact.whatsapp_name && (
                                <div className="text-xs text-gray-500">
                                  WhatsApp: {contact.whatsapp_name}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-2">{contact.phone}</td>
                          <td className="px-4 py-2">
                            {contact.has_whatsapp === null ? (
                              <Clock className="h-4 w-4 text-gray-400" />
                            ) : contact.has_whatsapp ? (
                              <CheckCircle className="h-4 w-4 text-success-600" />
                            ) : (
                              <XCircle className="h-4 w-4 text-error-600" />
                            )}
                          </td>
                          <td className="px-4 py-2">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              contact.status === 'active' 
                                ? 'bg-success-50 text-success-600' 
                                : 'bg-gray-50 text-gray-600'
                            }`}>
                              {contact.status === 'active' ? 'Ativo' : 'Inativo'}
                            </span>
                          </td>
                          <td className="px-4 py-2">{contact.tag}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
