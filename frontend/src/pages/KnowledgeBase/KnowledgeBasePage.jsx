import React, { useState } from 'react';
import {
  Search, Plus, FileText, Upload, Tag, X, Sparkles,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { knowledgeService, fileService } from '../../services/api';
import toast from 'react-hot-toast';

const categories = ['All', 'Product Catalog', 'Shipping Info', 'Policy', 'Manuals', 'FAQ', 'Documents'];

export default function KnowledgeBasePage() {
  const queryClient = useQueryClient();
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [newItem, setNewItem] = useState({ title: '', content: '', category: 'Product Catalog', tags: '' });

  // Fetch knowledge items (with optional semantic search)
  const { data: items, isLoading } = useQuery({
    queryKey: ['knowledge', searchQuery],
    queryFn: () => knowledgeService.getItems(searchQuery || undefined).then((r) => r.data),
  });

  // Create item mutation
  const createMutation = useMutation({
    mutationFn: (data) => knowledgeService.createItem(data),
    onSuccess: () => {
      toast.success('Knowledge item created');
      queryClient.invalidateQueries({ queryKey: ['knowledge'] });
      setShowCreate(false);
      setNewItem({ title: '', content: '', category: 'Product Catalog', tags: '' });
    },
    onError: () => toast.error('Failed to create item'),
  });

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchQuery(searchInput);
  };

  const filteredItems = activeCategory === 'All'
    ? (items || [])
    : (items || []).filter((i) => i.category === activeCategory);

  // File upload
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', file.name);
    formData.append('category', 'Documents');
    try {
      await fileService.uploadKnowledge(formData);
      toast.success('File uploaded to knowledge base');
      queryClient.invalidateQueries({ queryKey: ['knowledge'] });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Upload failed');
    }
    e.target.value = '';
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-10">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display text-white tracking-tight">Knowledge Base</h1>
          <p className="text-slate-400 text-sm mt-1.5">
            {items?.length || 0} items · AI semantic search enabled
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="px-4 py-2 bg-ink-900/60 border border-white/5 text-slate-300 rounded-xl font-bold text-xs flex items-center gap-2 hover:bg-white/5 transition-all cursor-pointer">
            <Upload size={14} /> Upload File
            <input type="file" onChange={handleFileUpload} className="hidden" accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png" />
          </label>
          <button onClick={() => setShowCreate(true)} className="btn-primary">
            <Plus size={16} /> Add Item
          </button>
        </div>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="glass p-5">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search with AI semantic search..."
              className="w-full pl-11 pr-4 py-2.5 bg-ink-950/50 rounded-xl border border-white/5 focus:border-neon-cyan/50 focus:ring-4 focus:ring-neon-cyan/5 outline-none transition-all text-sm"
            />
          </div>
          <button type="submit" className="btn-primary px-6">
            <Sparkles size={14} /> Search
          </button>
          {searchQuery && (
            <button onClick={() => { setSearchQuery(''); setSearchInput(''); }} className="text-slate-400 hover:text-white">
              <X size={18} />
            </button>
          )}
        </div>
      </form>

      {/* Categories */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap border ${
              activeCategory === cat
                ? 'bg-neon-cyan/10 text-white border-neon-cyan/40'
                : 'bg-transparent text-slate-500 border-white/5 hover:border-white/10'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Items Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-20 text-slate-500">
          {searchQuery ? 'No results found for your search' : 'No knowledge items yet'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <div key={item.id} className="glass glass-hover p-6 flex flex-col h-full group">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-neon-cyan/10 rounded-xl text-neon-cyan border border-neon-cyan/20">
                  <FileText size={20} />
                </div>
                <span className="text-[10px] font-mono text-slate-500">{item.category}</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2 group-hover:text-neon-cyan transition-colors">{item.title}</h3>
              <p className="text-sm text-slate-400 line-clamp-3 mb-4 flex-1">{item.content}</p>
              {item.tags && (
                <div className="flex items-center gap-2 flex-wrap">
                  {item.tags.split(',').map((tag) => (
                    <span key={tag} className="flex items-center gap-1 px-2 py-0.5 bg-white/5 text-[10px] font-bold rounded text-slate-500 uppercase">
                      <Tag size={8} /> {tag.trim()}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowCreate(false)}>
          <div className="glass w-full max-w-lg mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold font-display text-white">Add Knowledge Item</h2>
              <button onClick={() => setShowCreate(false)} className="text-slate-400 hover:text-white"><X size={20} /></button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(newItem); }} className="space-y-4">
              <div>
                <label className="label">Title</label>
                <input value={newItem.title} onChange={(e) => setNewItem((f) => ({ ...f, title: e.target.value }))} className="w-full px-4 py-2.5 bg-ink-950/50 rounded-xl border border-white/10 focus:border-neon-cyan/50 outline-none text-sm" />
              </div>
              <div>
                <label className="label">Content</label>
                <textarea value={newItem.content} onChange={(e) => setNewItem((f) => ({ ...f, content: e.target.value }))} rows={4} className="w-full px-4 py-2.5 bg-ink-950/50 rounded-xl border border-white/10 focus:border-neon-cyan/50 outline-none text-sm resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Category</label>
                  <select value={newItem.category} onChange={(e) => setNewItem((f) => ({ ...f, category: e.target.value }))} className="w-full px-4 py-2.5 bg-ink-950/50 rounded-xl border border-white/10 outline-none text-sm">
                    {categories.filter((c) => c !== 'All').map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Tags (comma separated)</label>
                  <input value={newItem.tags} onChange={(e) => setNewItem((f) => ({ ...f, tags: e.target.value }))} placeholder="bamboo, eco" className="w-full px-4 py-2.5 bg-ink-950/50 rounded-xl border border-white/10 outline-none text-sm" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowCreate(false)} className="px-5 py-2.5 text-slate-400 text-sm font-bold">Cancel</button>
                <button type="submit" disabled={createMutation.isPending} className="btn-primary disabled:opacity-50">
                  {createMutation.isPending ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
