
import React, { useState } from 'react';
import { Plus, Users, Mail, Phone, Search, Building2, X, Edit2, Trash2 } from 'lucide-react';
import { Client, ClientStatus } from '../types';

const ClientList = ({ state }: any) => {
  const { clients, addClient, deleteClient, updateClient } = state;
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  
  const [newClient, setNewClient] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    observations: '',
    status: ClientStatus.ACTIVE
  });

  const handleOpenModal = (client?: Client) => {
    if (client) {
      setEditingClient(client);
      setNewClient({
        name: client.name,
        company: client.company,
        email: client.email,
        phone: client.phone,
        observations: client.observations || '',
        status: client.status
      });
    } else {
      setEditingClient(null);
      setNewClient({ name: '', company: '', email: '', phone: '', observations: '', status: ClientStatus.ACTIVE });
    }
    setIsModalOpen(true);
  };

  const handleSaveClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingClient) {
      await updateClient(editingClient.id, newClient);
    } else {
      await addClient(newClient);
    }
    setIsModalOpen(false);
  };

  const handleDeleteClient = async (id: string, name: string) => {
    if (confirm(`Deseja realmente excluir o cliente "${name}"? Esta ação não pode ser desfeita.`)) {
      await deleteClient(id);
    }
  };

  const filteredClients = clients.filter((c: Client) => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.company.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight">Clientes</h1>
          <p className="text-gray-500 mt-2 font-medium">Sua base de contatos e empresas parceiras.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold flex items-center space-x-2 transition-all shadow-lg"
        >
          <Plus size={20} />
          <span>Adicionar Cliente</span>
        </button>
      </header>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input 
          type="text" 
          placeholder="Pesquisar cliente ou empresa..." 
          className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:outline-none shadow-sm transition-all text-gray-900"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-widest">
              <th className="px-8 py-5">Cliente</th>
              <th className="px-8 py-5">Empresa</th>
              <th className="px-8 py-5">Contato</th>
              <th className="px-8 py-5">Status</th>
              <th className="px-8 py-5 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredClients.map((client: Client) => (
              <tr key={client.id} className="hover:bg-gray-50 transition-colors group">
                <td className="px-8 py-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-lg">
                      {client.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-extrabold text-gray-900 group-hover:text-indigo-600 transition-colors">{client.name}</p>
                      <p className="text-xs text-gray-400 font-medium">ID: {client.id.slice(0, 8)}</p>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <div className="flex items-center space-x-2 text-gray-600 font-bold">
                    <Building2 size={16} className="text-gray-300" />
                    <span>{client.company}</span>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2 text-xs font-bold text-gray-500">
                      <Mail size={12} />
                      <span>{client.email}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-xs font-bold text-gray-500">
                      <Phone size={12} />
                      <span>{client.phone}</span>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    client.status === ClientStatus.ACTIVE ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {client.status}
                  </span>
                </td>
                <td className="px-8 py-6 text-right">
                  <div className="flex items-center justify-end space-x-2">
                    <button 
                      onClick={() => handleOpenModal(client)}
                      className="p-2 text-indigo-400 hover:text-indigo-600 bg-indigo-50 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button 
                      onClick={() => handleDeleteClient(client.id, client.name)}
                      className="p-2 text-rose-400 hover:text-rose-600 bg-rose-50 rounded-lg transition-colors"
                      title="Excluir"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredClients.length === 0 && (
          <div className="p-20 text-center text-gray-400 flex flex-col items-center">
            <Users size={60} strokeWidth={1} className="mb-4 text-gray-200" />
            <p className="text-lg font-bold">Nenhum cliente encontrado.</p>
            <p className="text-sm">Tente outro termo de busca ou adicione um novo cliente.</p>
          </div>
        )}
      </div>

      {/* Modal - Constrained to body area by left offset */}
      {isModalOpen && (
        <div className="fixed inset-0 left-0 lg:left-64 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-3xl text-gray-900">
              <h2 className="text-xl font-black">{editingClient ? 'Editar Cliente' : 'Novo Cliente'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X /></button>
            </div>
            <form onSubmit={handleSaveClient} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase mb-1">Nome Completo</label>
                <input required type="text" value={newClient.name} onChange={e => setNewClient({...newClient, name: e.target.value})} className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 placeholder-gray-400" placeholder="Nome do contato" />
              </div>
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase mb-1">Empresa</label>
                <input required type="text" value={newClient.company} onChange={e => setNewClient({...newClient, company: e.target.value})} className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 placeholder-gray-400" placeholder="Nome da empresa" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase mb-1">E-mail</label>
                  <input type="email" value={newClient.email} onChange={e => setNewClient({...newClient, email: e.target.value})} className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 placeholder-gray-400" placeholder="contato@empresa.com" />
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase mb-1">Telefone</label>
                  <input type="text" value={newClient.phone} onChange={e => setNewClient({...newClient, phone: e.target.value})} className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 placeholder-gray-400" placeholder="(00) 00000-0000" />
                </div>
              </div>
              {editingClient && (
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase mb-1">Status</label>
                  <select 
                    value={newClient.status} 
                    onChange={e => setNewClient({...newClient, status: e.target.value as ClientStatus})}
                    className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 font-bold"
                  >
                    <option value={ClientStatus.ACTIVE}>Ativo</option>
                    <option value={ClientStatus.LEAD}>Lead</option>
                    <option value={ClientStatus.PAUSED}>Pausado</option>
                    <option value={ClientStatus.FINISHED}>Finalizado</option>
                  </select>
                </div>
              )}
              <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold shadow-lg hover:bg-indigo-700 transition-all">
                {editingClient ? 'Salvar Alterações' : 'Salvar Cliente'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientList;
