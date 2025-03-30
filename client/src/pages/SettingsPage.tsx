import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { Settings } from '@/types';
import { formatWithUnits } from '@/utils/formatters';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Cpu, Leaf, Zap, Flame, Bot, Volume2, Sliders, Info, HelpCircle, Trash2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { FadeIn, SlideIn, ScaleIn, StaggeredChildren, GlowEffect } from '@/components/ui/animation';
import ProfileCard from '@/components/settings/ProfileCard';
import { ThemeBackground } from '@/components/ui/ThemeBackground';

export default function SettingsPage() {
  const { settings, updateSettings, ollamaModels, systemStatus } = useApp();
  
  // Local state for form values
  const [formValues, setFormValues] = useState<Partial<Settings>>({
    selectedModel: 'mistral',
    temperature: '0.7',
    contextLength: 4096,
    chunkSize: 512,
    topP: '0.9',
    ecoMode: true,
    gpuAcceleration: true,
    ttsEnabled: true,
    ttsVoice: 'alloy',
    ttsSpeechRate: '1.0',
  });
  
  // Update local state when settings load
  useEffect(() => {
    if (settings) {
      setFormValues(settings);
    }
  }, [settings]);
  
  // Create debounced update function
  const debounceUpdate = (updates: Partial<Settings>) => {
    updateSettings(updates);
  };
  
  // Handle input changes
  const handleChange = (field: keyof Settings, value: any) => {
    // Update local state immediately
    setFormValues(prev => ({ ...prev, [field]: value }));
    
    // Update remote state with debounce
    debounceUpdate({ [field]: value });
  };
  
  // Handle toggle changes
  const handleToggle = (field: keyof Settings) => {
    const newValue = !formValues[field];
    handleChange(field, newValue);
  };
  
  // Profile presets following Step 6 requirements
  const profilePresets = {
    default: {
      temperature: '0.7',
      topP: '0.9',
      contextLength: 1024,
      chunkSize: 512,
      ecoMode: false,
    },
    light: {
      temperature: '0.9', 
      topP: '0.95',
      contextLength: 512,
      chunkSize: 256,
      ecoMode: true,
    },
    high: {
      temperature: '0.5',
      topP: '0.85',
      contextLength: 2048,
      chunkSize: 1024,
      ecoMode: false,
    },
    overdrive: {
      temperature: '0.3',
      topP: '0.75',
      contextLength: 4096,
      chunkSize: 2048,
      ecoMode: false,
    }
  };
  
  // Apply profile settings with immediate theme changes
  const applyProfile = (profileName: 'default' | 'light' | 'high' | 'overdrive') => {
    const profile = profilePresets[profileName];
    
    // Apply settings
    handleChange('temperature', profile.temperature);
    handleChange('topP', profile.topP);
    handleChange('contextLength', profile.contextLength);
    handleChange('chunkSize', profile.chunkSize);
    handleChange('ecoMode', profile.ecoMode);
    handleChange('temperatureProfile', profileName);
    
    // Apply theme immediately based on selected profile
    const body = document.body;
    body.classList.remove('eco-mode', 'performance-mode', 'overdrive-mode');
    
    if (profileName === 'light') {
      body.classList.add('eco-mode');
    } else if (profileName === 'high') {
      body.classList.add('performance-mode');
    } else if (profileName === 'overdrive') {
      body.classList.add('overdrive-mode');
    }
  };
  
  // Get currently active profile
  const getCurrentProfile = () => {
    // Use the explicit temperature profile if available
    if (formValues.temperatureProfile) return formValues.temperatureProfile;
    
    // Otherwise infer from settings
    if (formValues.ecoMode) return 'light';
    if (formValues.contextLength && formValues.contextLength >= 4096) return 'overdrive';
    if (formValues.contextLength && formValues.contextLength >= 2048) return 'high';
    return 'default';
  };
  
  // Get profile description
  const getProfileDescription = (profile: string) => {
    switch(profile) {
      case 'default': return 'Balanced performance and quality';
      case 'light': return 'Faster responses, lower resource usage';
      case 'high': return 'Higher quality responses, more resource intensive';
      case 'overdrive': return 'Maximum quality and context, highest resource usage';
      default: return '';
    }
  };
  
  const activeProfile = getCurrentProfile();
  
  return (
    <div className="flex-1 flex flex-col h-full">
      <header style={{ 
        backgroundColor: 'var(--bg-tertiary)', 
        borderColor: 'var(--border-color)' 
      }} className="p-4 border-b">
        <h2 style={{ color: 'var(--text-accent)' }} className="font-medium text-xl">Settings</h2>
      </header>
      
      <div style={{ backgroundColor: 'var(--bg-secondary)' }} className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Performance Profiles Section */}
          <section style={{ 
            backgroundColor: 'var(--card-bg)', 
            borderColor: 'var(--border-color)',
            boxShadow: 'var(--shadow-md)' 
          }} className="border rounded-lg p-6">
            <h3 style={{ color: 'var(--text-accent)' }} className="text-lg font-medium mb-6 flex items-center">
              <Cpu size={20} className="mr-2" style={{ color: 'var(--primary-color)' }} />
              Performance Profiles
            </h3>
            
            <div className="space-y-6">
              {/* Profile Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="transition-all duration-300 hover:scale-105">
                  <ProfileCard 
                    profile="default"
                    isActive={activeProfile === 'default'}
                    onClick={() => applyProfile('default')}
                    description="Balanced performance and quality"
                  />
                </div>

                <div className="transition-all duration-300 hover:scale-105">
                  <ProfileCard 
                    profile="light"
                    isActive={activeProfile === 'light'}
                    onClick={() => applyProfile('light')}
                    description="Faster responses, efficient resources"
                  />
                </div>

                <div className="transition-all duration-300 hover:scale-105">
                  <ProfileCard 
                    profile="high"
                    isActive={activeProfile === 'high'}
                    onClick={() => applyProfile('high')}
                    description="Higher quality, more context"
                  />
                </div>

                <div className="transition-all duration-300 hover:scale-105">
                  <ProfileCard 
                    profile="overdrive"
                    isActive={activeProfile === 'overdrive'}
                    onClick={() => applyProfile('overdrive')}
                    description="Maximum quality and context"
                  />
                </div>
              </div>
              
              {/* Eco Mode Toggle */}
              <div className="flex items-center justify-between p-5 mt-4" 
                style={{ 
                  backgroundColor: 'var(--bg-tertiary)',
                  borderColor: 'var(--border-color)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border-color)',
                  boxShadow: 'var(--shadow-md)',
                  transition: 'transform 0.2s ease, box-shadow 0.3s ease'
                }}>
                <div>
                  <div style={{ color: 'var(--text-primary)' }} className="font-medium flex items-center">
                    <Leaf size={18} className="mr-2" style={{ color: formValues.ecoMode ? 'var(--success-color)' : 'var(--text-muted)' }} />
                    <span>Eco Mode</span>
                    <TooltipProvider delayDuration={300}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle size={14} className="ml-2 cursor-help" style={{ color: 'var(--text-muted)' }} />
                        </TooltipTrigger>
                        <TooltipContent style={{ 
                          backgroundColor: 'var(--bg-tertiary)', 
                          color: 'var(--text-primary)',
                          borderColor: 'var(--border-color)'
                        }}>
                          <p className="text-xs">Uses 4-bit quantization for better performance with lower resource usage</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <p style={{ color: 'var(--text-muted)' }} className="text-sm mt-1">Optimize for efficiency over quality</p>
                </div>
                
                <Switch 
                  checked={!!formValues.ecoMode} 
                  onCheckedChange={() => handleToggle('ecoMode')} 
                  style={{ 
                    backgroundColor: formValues.ecoMode ? 'var(--success-color)' : 'var(--toggle-bg-off)' 
                  }}
                />
              </div>
              
              {/* GPU Acceleration Toggle */}
              <div className="flex items-center justify-between p-5 mt-4" 
                style={{ 
                  backgroundColor: 'var(--bg-tertiary)',
                  borderColor: 'var(--border-color)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border-color)',
                  boxShadow: 'var(--shadow-md)',
                  transition: 'transform 0.2s ease, box-shadow 0.3s ease'
                }}>
                <div>
                  <div style={{ color: 'var(--text-primary)' }} className="font-medium flex items-center">
                    <Cpu size={18} className="mr-2" style={{ color: formValues.gpuAcceleration && systemStatus.gpuAvailable ? 'var(--info-color)' : 'var(--text-muted)' }} />
                    <span>GPU Acceleration</span>
                    <TooltipProvider delayDuration={300}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle size={14} className="ml-2 cursor-help" style={{ color: 'var(--text-muted)' }} />
                        </TooltipTrigger>
                        <TooltipContent style={{ 
                          backgroundColor: 'var(--bg-tertiary)', 
                          color: 'var(--text-primary)',
                          borderColor: 'var(--border-color)'
                        }}>
                          <p className="text-xs">Utilizes NVIDIA GPU for faster inference when available</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <p style={{ color: 'var(--text-muted)' }} className="text-sm mt-1">
                    {systemStatus.gpuAvailable 
                      ? `NVIDIA GPU detected: ${systemStatus.gpuName || 'GPU'}` 
                      : 'No NVIDIA GPU detected'}
                  </p>
                </div>
                
                <Switch 
                  checked={!!formValues.gpuAcceleration} 
                  onCheckedChange={() => handleToggle('gpuAcceleration')} 
                  disabled={!systemStatus.gpuAvailable}
                  style={{ 
                    backgroundColor: formValues.gpuAcceleration && systemStatus.gpuAvailable ? 'var(--info-color)' : 'var(--toggle-bg-off)' 
                  }}
                />
              </div>
            </div>
          </section>
          
          {/* Model Selection Section */}
          <section style={{ 
            backgroundColor: 'var(--card-bg)', 
            borderColor: 'var(--border-color)',
            boxShadow: 'var(--shadow-md)' 
          }} className="border rounded-lg p-6">
            <h3 style={{ color: 'var(--text-accent)' }} className="text-lg font-medium mb-6 flex items-center">
              <Bot size={20} className="mr-2" style={{ color: 'var(--primary-color)' }} />
              Model Selection
            </h3>
            
            <div className="space-y-4">
              {/* Model Dropdown */}
              <div>
                <Label 
                  style={{ color: 'var(--text-primary)' }} 
                  className="block text-sm font-medium mb-2">
                  Ollama Model
                </Label>
                <Select 
                  value={formValues.selectedModel}
                  onValueChange={value => handleChange('selectedModel', value)}
                  disabled={!systemStatus.ollamaRunning}
                >
                  <SelectTrigger 
                    style={{
                      backgroundColor: 'var(--input-bg)',
                      color: 'var(--text-primary)',
                      borderColor: 'var(--border-color)'
                    }}
                    className="border rounded-lg py-3 px-4 w-full focus:outline-none focus:ring-2 ring-offset-2 ring-offset-background">
                    <SelectValue placeholder="Select a model" />
                  </SelectTrigger>
                  <SelectContent style={{
                    backgroundColor: 'var(--bg-tertiary)',
                    color: 'var(--text-primary)',
                    borderColor: 'var(--border-color)'
                  }}>
                    {ollamaModels.length === 0 ? (
                      <SelectItem value="none" disabled>No models available</SelectItem>
                    ) : (
                      ollamaModels.map(model => (
                        <SelectItem key={model.name} value={model.name}>
                          {model.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <p style={{ color: 'var(--text-muted)' }} className="text-xs mt-1">
                  {formValues.selectedModel && ollamaModels.find(m => m.name === formValues.selectedModel)?.size
                    ? `Model size: ${ollamaModels.find(m => m.name === formValues.selectedModel)?.size} • Optimized for chat`
                    : 'Select a model to view details'}
                </p>
              </div>
              
              {/* Model Status */}
              <div style={{
                backgroundColor: 'var(--bg-tertiary)',
                borderColor: 'var(--border-color)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-sm)'
              }} className="p-5 rounded-lg">
                <div className="flex items-center">
                  <div className="w-2 h-2 rounded-full mr-2" style={{ 
                    backgroundColor: systemStatus.ollamaRunning ? 'var(--success-color)' : 'var(--error-color)' 
                  }}></div>
                  <span style={{ color: 'var(--text-primary)' }} className="text-sm">
                    {systemStatus.ollamaRunning
                      ? 'Ollama is running and models are ready'
                      : 'Ollama is not running. Please start Ollama to use models.'}
                  </span>
                </div>
                <div style={{ color: 'var(--text-muted)' }} className="mt-2 text-xs">
                  {ollamaModels.find(m => m.name === formValues.selectedModel)?.modified
                    ? `Last updated: ${new Date(ollamaModels.find(m => m.name === formValues.selectedModel)?.modified || '').toLocaleString()}`
                    : 'No model information available'}
                </div>
              </div>
            </div>
          </section>
          
          {/* Advanced Parameters Section */}
          <section style={{ 
            backgroundColor: 'var(--card-bg)', 
            borderColor: 'var(--border-color)',
            boxShadow: 'var(--shadow-md)' 
          }} className="border rounded-lg p-6">
            <h3 style={{ color: 'var(--text-accent)' }} className="text-lg font-medium mb-6 flex items-center">
              <Sliders size={20} className="mr-2" style={{ color: 'var(--primary-color)' }} />
              Advanced Parameters
            </h3>
            
            <div className="space-y-6">
              {/* Temperature Slider */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label style={{ color: 'var(--text-primary)' }} className="text-sm font-medium flex items-center">
                    <span>Temperature</span>
                    <TooltipProvider delayDuration={300}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle size={14} className="ml-2 cursor-help" style={{ color: 'var(--text-muted)' }} />
                        </TooltipTrigger>
                        <TooltipContent style={{ 
                          backgroundColor: 'var(--bg-tertiary)', 
                          color: 'var(--text-primary)',
                          borderColor: 'var(--border-color)'
                        }}>
                          <p className="text-xs">Controls randomness: Lower values make output more focused and deterministic, higher values make output more random and creative.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Label>
                  <span style={{ color: 'var(--text-primary)' }} className="text-sm font-mono">{formValues.temperature}</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="2" 
                  step="0.1" 
                  value={formValues.temperature}
                  onChange={(e) => handleChange('temperature', e.target.value)}
                  style={{
                    backgroundColor: 'var(--bg-tertiary)',
                    accentColor: 'var(--primary-color)'
                  }}
                  className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs mt-1">
                  <span style={{ color: 'var(--text-muted)' }}>Precise</span>
                  <span style={{ color: 'var(--text-muted)' }}>Creative</span>
                </div>
              </div>
              
              {/* Token Context Length */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label style={{ color: 'var(--text-primary)' }} className="text-sm font-medium flex items-center">
                    <span>Context Length</span>
                    <TooltipProvider delayDuration={300}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle size={14} className="ml-2 cursor-help" style={{ color: 'var(--text-muted)' }} />
                        </TooltipTrigger>
                        <TooltipContent style={{ 
                          backgroundColor: 'var(--bg-tertiary)', 
                          color: 'var(--text-primary)',
                          borderColor: 'var(--border-color)'
                        }}>
                          <p className="text-xs">Maximum number of tokens to consider from conversation history. Higher values use more memory but provide more context.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Label>
                  <span style={{ color: 'var(--text-primary)' }} className="text-sm font-mono">{formValues.contextLength}</span>
                </div>
                <input 
                  type="range" 
                  min="1024" 
                  max="8192" 
                  step="1024" 
                  value={formValues.contextLength}
                  onChange={(e) => handleChange('contextLength', parseInt(e.target.value))}
                  style={{
                    backgroundColor: 'var(--bg-tertiary)',
                    accentColor: 'var(--primary-color)'
                  }}
                  className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs mt-1">
                  <span style={{ color: 'var(--text-muted)' }}>1K</span>
                  <span style={{ color: 'var(--text-muted)' }}>8K</span>
                </div>
              </div>
              
              {/* Chunk Size */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label style={{ color: 'var(--text-primary)' }} className="text-sm font-medium flex items-center">
                    <span>Chunk Size</span>
                    <TooltipProvider delayDuration={300}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle size={14} className="ml-2 cursor-help" style={{ color: 'var(--text-muted)' }} />
                        </TooltipTrigger>
                        <TooltipContent style={{ 
                          backgroundColor: 'var(--bg-tertiary)', 
                          color: 'var(--text-primary)',
                          borderColor: 'var(--border-color)'
                        }}>
                          <p className="text-xs">Size of document chunks for processing. Smaller chunks are more precise for specific information, larger chunks provide more context.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Label>
                  <span style={{ color: 'var(--text-primary)' }} className="text-sm font-mono">{formValues.chunkSize}</span>
                </div>
                <input 
                  type="range" 
                  min="128" 
                  max="1024" 
                  step="128" 
                  value={formValues.chunkSize}
                  onChange={(e) => handleChange('chunkSize', parseInt(e.target.value))}
                  style={{
                    backgroundColor: 'var(--bg-tertiary)',
                    accentColor: 'var(--primary-color)'
                  }}
                  className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs mt-1">
                  <span style={{ color: 'var(--text-muted)' }}>128</span>
                  <span style={{ color: 'var(--text-muted)' }}>1024</span>
                </div>
              </div>
              
              {/* Top P (Nucleus Sampling) */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label style={{ color: 'var(--text-primary)' }} className="text-sm font-medium flex items-center">
                    <span>Top P</span>
                    <TooltipProvider delayDuration={300}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle size={14} className="ml-2 cursor-help" style={{ color: 'var(--text-muted)' }} />
                        </TooltipTrigger>
                        <TooltipContent style={{ 
                          backgroundColor: 'var(--bg-tertiary)', 
                          color: 'var(--text-primary)',
                          borderColor: 'var(--border-color)'
                        }}>
                          <p className="text-xs">Controls diversity via nucleus sampling: only consider tokens comprising the top P probability mass. Lower values make output more focused.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Label>
                  <span style={{ color: 'var(--text-primary)' }} className="text-sm font-mono">{formValues.topP}</span>
                </div>
                <input 
                  type="range" 
                  min="0.1" 
                  max="1" 
                  step="0.05" 
                  value={formValues.topP}
                  onChange={(e) => handleChange('topP', e.target.value)}
                  style={{
                    backgroundColor: 'var(--bg-tertiary)',
                    accentColor: 'var(--primary-color)'
                  }}
                  className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs mt-1">
                  <span style={{ color: 'var(--text-muted)' }}>Focused</span>
                  <span style={{ color: 'var(--text-muted)' }}>Diverse</span>
                </div>
              </div>
            </div>
          </section>
          
          {/* Text-to-Speech Settings Section */}
          <section style={{ 
            backgroundColor: 'var(--card-bg)', 
            borderColor: 'var(--border-color)',
            boxShadow: 'var(--shadow-md)' 
          }} className="border rounded-lg p-6">
            <h3 style={{ color: 'var(--text-accent)' }} className="text-lg font-medium mb-6 flex items-center">
              <Volume2 size={20} className="mr-2" style={{ color: 'var(--primary-color)' }} />
              Text-to-Speech
            </h3>
            
            <div className="space-y-6">
              {/* TTS Enable Toggle */}
              <div className="flex items-center justify-between p-5" 
                style={{ 
                  backgroundColor: 'var(--bg-tertiary)',
                  borderColor: 'var(--border-color)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border-color)',
                  boxShadow: 'var(--shadow-md)',
                  transition: 'transform 0.2s ease, box-shadow 0.3s ease'
                }}>
                <div>
                  <div style={{ color: 'var(--text-primary)' }} className="font-medium flex items-center">
                    <Volume2 size={18} className="mr-2" style={{ color: formValues.ttsEnabled ? 'var(--primary-color)' : 'var(--text-muted)' }} />
                    <span>Enable Text-to-Speech</span>
                  </div>
                  <p style={{ color: 'var(--text-muted)' }} className="text-sm mt-1">Read AI responses aloud automatically</p>
                </div>
                
                <Switch 
                  checked={!!formValues.ttsEnabled} 
                  onCheckedChange={() => handleToggle('ttsEnabled')} 
                  style={{ 
                    backgroundColor: formValues.ttsEnabled ? 'var(--primary-color)' : 'var(--toggle-bg-off)' 
                  }}
                />
              </div>
              
              {/* Voice Selection */}
              <div>
                <Label 
                  style={{ color: 'var(--text-primary)' }} 
                  className="block text-sm font-medium mb-2">
                  Voice
                </Label>
                <Select 
                  value={formValues.ttsVoice}
                  onValueChange={value => handleChange('ttsVoice', value)}
                  disabled={!formValues.ttsEnabled}
                >
                  <SelectTrigger 
                    style={{
                      backgroundColor: 'var(--input-bg)',
                      color: 'var(--text-primary)',
                      borderColor: 'var(--border-color)',
                      opacity: formValues.ttsEnabled ? 1 : 0.6
                    }}
                    className="border rounded-lg py-3 px-4 w-full focus:outline-none focus:ring-2 ring-offset-2 ring-offset-background">
                    <SelectValue placeholder="Select a voice" />
                  </SelectTrigger>
                  <SelectContent style={{
                    backgroundColor: 'var(--bg-tertiary)',
                    color: 'var(--text-primary)',
                    borderColor: 'var(--border-color)'
                  }}>
                    <SelectItem value="alloy">Alloy (Neutral)</SelectItem>
                    <SelectItem value="echo">Echo (Male)</SelectItem>
                    <SelectItem value="fable">Fable (Female)</SelectItem>
                    <SelectItem value="onyx">Onyx (Male)</SelectItem>
                    <SelectItem value="nova">Nova (Female)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Speech Rate */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label style={{ color: 'var(--text-primary)' }} className="text-sm font-medium">Speech Rate</Label>
                  <span style={{ color: 'var(--text-primary)' }} className="text-sm font-mono">{formValues.ttsSpeechRate}x</span>
                </div>
                <input 
                  type="range" 
                  min="0.5" 
                  max="2" 
                  step="0.1" 
                  value={formValues.ttsSpeechRate}
                  onChange={(e) => handleChange('ttsSpeechRate', e.target.value)}
                  style={{
                    backgroundColor: 'var(--bg-tertiary)',
                    accentColor: 'var(--primary-color)',
                    opacity: formValues.ttsEnabled ? 1 : 0.6
                  }}
                  className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                  disabled={!formValues.ttsEnabled}
                />
                <div className="flex justify-between text-xs mt-1">
                  <span style={{ color: 'var(--text-muted)' }}>Slower</span>
                  <span style={{ color: 'var(--text-muted)' }}>Faster</span>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
