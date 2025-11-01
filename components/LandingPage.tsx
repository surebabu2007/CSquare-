import React, { useState, useRef } from 'react';
import type { StoryPreferences, ComicHistoryItem } from '../types';
import { motion } from 'framer-motion';
import { UploadCloudIcon, AlertCircle, X } from './icons';
import HistoryBrowser from './HistoryBrowser';

interface LandingPageProps {
  onCreateComic: (preferences: StoryPreferences, imageFiles: File[]) => void;
  error: string | null;
  history: ComicHistoryItem[];
  onLoadComic: (id: string) => void;
  onDeleteComic: (id: string) => void;
}

const moods: StoryPreferences['mood'][] = ['Gritty & Intense', 'High-Octane Action', 'Dramatic & Emotional', 'Sleek & Stylish'];
const storyTypes: StoryPreferences['storyType'][] = ['Origin Story', 'Rivalry', 'Underdog Victory', 'Heist'];
const artStyles: string[] = [
  'AAA Racing Game (Forza Style)',
  'Hyper-Realistic Cinematic',
  'Classic American Comic (1980s)',
  'Japanese Manga (Shonen)',
  'Gritty Noir (Sin City Style)',
  'Cute Chibi Art Style',
  'Cute Cartoon Art Style',
  'Vibrant Pop Art (Lichtenstein)',
  'Dark Thriller',
  'Minecraft Art Style',
  'Pixel Art Style',
  'Claymation',
  'Origami Art Style',
  'Impressionistic Watercolor',
  'Charcoal Sketch',
  'Cel-Shaded (Video Game)',
  'Art Deco',
  'Cyberpunk Neon',
  'Steampunk Engraving',
  'Surrealist Fantasy',
  'Minimalist Line Art',
  'Vintage Cartoon (1930s)',
  'Gothic Horror',
  'Technical Blueprint',
  'Graffiti Street Art',
  'Abstract Expressionist',
  'Photorealistic',
  'Dark Fantasy Oil Painting'
];

function LandingPage({ onCreateComic, error, history, onLoadComic, onDeleteComic }: LandingPageProps) {
  const [preferences, setPreferences] = useState<Omit<StoryPreferences, 'storyDescription'>>({
    mood: 'Gritty & Intense',
    storyType: 'Rivalry',
    artStyle: artStyles[0],
  });
  const [storyDescription, setStoryDescription] = useState('');
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [localError, setLocalError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFiles(files: FileList | null) {
    if (!files) return;
    const newFiles = Array.from(files);
    let validFiles = [...imageFiles];
    let newPreviews = [...imagePreviews];
    let errorFound = false;

    newFiles.forEach(file => {
        if(file.size > 4 * 1024 * 1024) { // 4MB limit
            setLocalError(`'${file.name}' is too large. Max size is 4MB.`);
            errorFound = true;
        } else if (validFiles.length + 1 <= 5) {
            validFiles.push(file);
            newPreviews.push(URL.createObjectURL(file));
        } else {
             setLocalError('You can upload a maximum of 5 images.');
             errorFound = true;
        }
    });

    if (!errorFound) setLocalError(null);
    setImageFiles(validFiles);
    setImagePreviews(newPreviews);
  }

  function removeImage(index: number) {
    setImageFiles(files => files.filter((_, i) => i !== index));
    setImagePreviews(previews => previews.filter((_, i) => i !== index));
  }
  
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (imageFiles.length === 0) {
      setLocalError('Please upload at least one image for your main character.');
      return;
    }
    setLocalError(null);
    onCreateComic({ ...preferences, storyDescription }, imageFiles);
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-csr-dark" style={{backgroundImage: `radial-gradient(circle at center, rgba(42, 42, 42, 0.5) 0%, #101010 70%)`}}>
      <motion.div 
        className="text-center animate-text-focus-in pt-16"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <h1 className="text-5xl md:text-7xl font-black uppercase text-white tracking-wider">
          CSR2 <span className="text-csr-red">Comic</span> Creator
        </h1>
        <p className="mt-4 text-lg text-csr-light-gray max-w-2xl mx-auto">
          Upload your photos, describe your story, and become a street racing legend in a 15-page comic epic.
        </p>
      </motion.div>

      <motion.form 
        onSubmit={handleSubmit} 
        className="mt-10 w-full max-w-6xl bg-csr-gray bg-opacity-50 backdrop-blur-sm p-8 rounded-lg border border-csr-light-gray/20 shadow-2xl animate-scale-up-center"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
             <div>
                <h3 className="text-xl font-bold text-csr-blue mb-4">1. UPLOAD CHARACTER IMAGES</h3>
                 <label onDragOver={(e) => e.preventDefault()} onDrop={(e) => {e.preventDefault(); handleFiles(e.dataTransfer.files);}} className="flex flex-col items-center justify-center w-full min-h-[16rem] border-2 border-dashed rounded-lg cursor-pointer transition-colors border-csr-light-gray/50 hover:border-csr-blue/70 hover:bg-black/20">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6 text-csr-light-gray">
                        <UploadCloudIcon className="w-10 h-10 mb-3" />
                        <p className="mb-2 text-sm"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                        <p className="text-xs">PNG, JPG, or WEBP (MAX 4MB, 5 images)</p>
                    </div>
                    <input ref={fileInputRef} id="dropzone-file" type="file" multiple className="hidden" accept="image/png, image/jpeg, image/webp" onChange={(e) => handleFiles(e.target.files)} />
                </label>
                {imagePreviews.length > 0 && (
                    <div className="mt-4 grid grid-cols-3 sm:grid-cols-5 gap-4">
                        {imagePreviews.map((src, i) => (
                            <div key={i} className="relative group">
                                <img src={src} alt={`Preview ${i+1}`} className="w-full h-24 object-cover rounded-lg" />
                                <button type="button" onClick={() => removeImage(i)} className="absolute -top-2 -right-2 bg-csr-red rounded-full p-1 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
             </div>
          </div>
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-csr-blue">2. CUSTOMIZE YOUR STORY</h3>
            <div>
                <label htmlFor="storyDescription" className="block mb-2 text-sm font-medium text-white">STORY GOAL</label>
                <textarea id="storyDescription" value={storyDescription} onChange={(e) => setStoryDescription(e.target.value)} rows={4} className="bg-csr-dark border border-csr-light-gray/50 text-white text-sm rounded-lg focus:ring-csr-blue focus:border-csr-blue block w-full p-2.5" placeholder="e.g., A story about winning a rare car from a rival crew chief."></textarea>
            </div>
             <div>
                <label htmlFor="artStyle" className="block mb-2 text-sm font-medium text-white">ART STYLE</label>
                <select id="artStyle" value={preferences.artStyle} onChange={(e) => setPreferences({...preferences, artStyle: e.target.value})} className="bg-csr-dark border border-csr-light-gray/50 text-white text-sm rounded-lg focus:ring-csr-blue focus:border-csr-blue block w-full p-2.5">
                  {artStyles.map(m => <option key={m}>{m}</option>)}
                </select>
            </div>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <div>
                <label htmlFor="mood" className="block mb-2 text-sm font-medium text-white">MOOD</label>
                <select id="mood" value={preferences.mood} onChange={(e) => setPreferences({...preferences, mood: e.target.value as any})} className="bg-csr-dark border border-csr-light-gray/50 text-white text-sm rounded-lg focus:ring-csr-blue focus:border-csr-blue block w-full p-2.5">
                  {moods.map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="storyType" className="block mb-2 text-sm font-medium text-white">STORY TYPE</label>
                <select id="storyType" value={preferences.storyType} onChange={(e) => setPreferences({...preferences, storyType: e.target.value as any})} className="bg-csr-dark border border-csr-light-gray/50 text-white text-sm rounded-lg focus:ring-csr-blue focus:border-csr-blue block w-full p-2.5">
                  {storyTypes.map(st => <option key={st}>{st}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>
        
        {(localError || error) && (
            <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 flex items-center p-3 text-sm text-red-400 bg-red-900/50 rounded-lg"
            >
                <AlertCircle className="w-5 h-5 mr-2"/>
                {localError || error}
            </motion.div>
        )}

        <div className="mt-8 text-center">
            <button type="submit" className="text-white bg-csr-red hover:bg-red-700 focus:ring-4 focus:outline-none focus:ring-red-900 font-bold rounded-lg text-lg px-12 py-3.5 text-center transition-transform transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed" disabled={imageFiles.length === 0}>
                CREATE MY 15-PAGE COMIC
            </button>
        </div>
      </motion.form>

      {history.length > 0 && (
          <HistoryBrowser 
            history={history}
            onLoad={onLoadComic}
            onDelete={onDeleteComic}
          />
      )}
    </div>
  );
}

export default LandingPage;
