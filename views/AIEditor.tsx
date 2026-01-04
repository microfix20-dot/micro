import React, { useState } from 'react';
import { Upload, Sparkles, Download, X, Image as ImageIcon, Wand2 } from 'lucide-react';
import { editImageWithAI } from '../services/gemini';

export const AIEditor: React.FC = () => {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [editedImage, setEditedImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setOriginalImage(ev.target?.result as string);
        setEditedImage(null);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!originalImage || !prompt) return;

    setIsLoading(true);
    setError(null);
    setEditedImage(null);

    try {
      const result = await editImageWithAI(originalImage, prompt);
      if (result) {
        setEditedImage(result);
      } else {
        setError("The AI could not generate an edited image. Please try a different prompt.");
      }
    } catch (err) {
      setError("An error occurred while processing the image.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 h-[calc(100vh-4rem)] flex flex-col">
      <div className="flex justify-between items-center">
        <div>
           <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
             <Sparkles className="text-purple-600" /> AI Image Studio
           </h2>
           <p className="text-slate-500 text-sm">Edit repair photos or marketing assets using natural language.</p>
        </div>
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden">
        
        {/* Left Panel: Input */}
        <div className="w-1/3 flex flex-col gap-4 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
           
           <div className="flex-1 flex flex-col gap-4 overflow-y-auto">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">1. Upload Image</label>
                <div className="relative border-2 border-dashed border-slate-300 rounded-lg h-48 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors group">
                   {originalImage ? (
                      <div className="relative w-full h-full p-2">
                        <img src={originalImage} alt="Original" className="w-full h-full object-contain" />
                        <button 
                          onClick={() => setOriginalImage(null)}
                          className="absolute top-2 right-2 bg-white/90 p-1 rounded-full shadow-sm text-slate-600 hover:text-red-500"
                        >
                           <X size={16} />
                        </button>
                      </div>
                   ) : (
                      <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer">
                         <Upload size={32} className="text-slate-400 mb-2 group-hover:text-blue-500" />
                         <span className="text-sm text-slate-500">Click to Upload</span>
                         <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                      </label>
                   )}
                </div>
              </div>

              <div>
                 <label className="block text-sm font-bold text-slate-700 mb-2">2. Describe Changes</label>
                 <textarea 
                    className="w-full border p-3 rounded-lg h-32 resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="e.g. 'Remove the background', 'Make it look like a sketch', 'Highlight the crack in red'"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                 />
              </div>

              {error && (
                 <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100">
                    {error}
                 </div>
              )}
           </div>

           <button 
              onClick={handleGenerate}
              disabled={!originalImage || !prompt || isLoading}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg font-bold shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
           >
              {isLoading ? (
                 <>
                   <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                   Processing...
                 </>
              ) : (
                 <>
                   <Wand2 size={20} /> Generate
                 </>
              )}
           </button>
        </div>

        {/* Right Panel: Output */}
        <div className="flex-1 bg-slate-900 rounded-xl shadow-inner flex items-center justify-center relative overflow-hidden">
           <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
           
           {!originalImage && !editedImage && (
              <div className="text-slate-600 flex flex-col items-center">
                 <ImageIcon size={64} className="mb-4 opacity-20" />
                 <p>Upload an image to start editing</p>
              </div>
           )}

           {originalImage && !editedImage && !isLoading && (
              <div className="relative max-w-full max-h-full p-8">
                 <img src={originalImage} alt="Preview" className="max-w-full max-h-[80vh] rounded shadow-2xl" />
                 <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-black/50 text-white px-4 py-1 rounded-full text-sm backdrop-blur-sm">
                    Original Preview
                 </div>
              </div>
           )}

           {isLoading && (
              <div className="flex flex-col items-center text-white z-10">
                 <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                 <p className="animate-pulse">AI is working its magic...</p>
                 <p className="text-xs text-slate-400 mt-2">This may take a few seconds</p>
              </div>
           )}

           {editedImage && (
              <div className="relative max-w-full max-h-full p-8 flex flex-col items-center">
                 <img src={editedImage} alt="Edited Result" className="max-w-full max-h-[80vh] rounded shadow-2xl border-2 border-purple-500/50" />
                 <div className="mt-6 flex gap-4">
                    <a 
                      href={editedImage} 
                      download="edited-image.png"
                      className="bg-white text-slate-900 px-6 py-2 rounded-full font-bold hover:bg-slate-100 flex items-center gap-2 shadow-lg"
                    >
                       <Download size={18} /> Download Result
                    </a>
                    <button 
                      onClick={() => setEditedImage(null)}
                      className="bg-slate-700 text-white px-6 py-2 rounded-full font-medium hover:bg-slate-600"
                    >
                       Try Again
                    </button>
                 </div>
              </div>
           )}
        </div>

      </div>
    </div>
  );
};