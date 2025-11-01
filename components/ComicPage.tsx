import React from 'react';
import type { ComicPanelData } from '../types';
import type { AudioState } from '../App';
import ComicPanel from './ComicPanel';

interface ComicPageProps {
  panels: ComicPanelData[];
  onEdit: (panel: ComicPanelData) => void;
  onTalk: (character: string) => void;
  onAdjustFrame: (panel: ComicPanelData) => void;
  onPlayAudio: (panelId: number, text: string, voiceSuggestion: string) => void;
  audioState: AudioState;
}

function ComicPage({ panels, onEdit, onTalk, onAdjustFrame, onPlayAudio, audioState }: ComicPageProps) {
  const panelCount = panels.length;

  // Determine layout based on the number of panels for this page
  function getLayout() {
    switch (panelCount) {
      case 1:
        return {
          gridClass: 'grid-cols-1 grid-rows-1',
          panelClasses: ['h-[70vh]'],
        };
      case 2:
        return {
          gridClass: 'grid-cols-1 md:grid-cols-2 grid-rows-2 md:grid-rows-1 h-[70vh]',
          panelClasses: ['row-span-1', 'row-span-1'],
        };
      case 3:
        return {
          gridClass: 'grid-cols-2 grid-rows-2 h-[80vh]',
          panelClasses: [
            'col-span-2 row-span-1', // Top full-width panel
            'col-span-1 row-span-1', // Bottom-left panel
            'col-span-1 row-span-1', // Bottom-right panel
          ],
        };
      default:
        return {
          gridClass: 'grid-cols-1 grid-rows-1',
          panelClasses: ['h-[70vh]'],
        };
    }
  }

  const { gridClass, panelClasses } = getLayout();

  return (
    <div className={`grid ${gridClass} gap-4`}>
      {panels.map((panel, index) => (
        <ComicPanel
          key={panel.id}
          panel={panel}
          onEdit={() => onEdit(panel)}
          onTalk={onTalk}
          onAdjustFrame={() => onAdjustFrame(panel)}
          onPlayAudio={onPlayAudio}
          audioState={audioState}
          className={panelClasses[index]}
        />
      ))}
    </div>
  );
}

export default ComicPage;