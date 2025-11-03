import React from 'react';

// Using i-lucide for cleaner icon components
// This assumes lucide.createIcons() is called from the HTML after load.

interface IconProps {
    className?: string;
}

export function UploadCloudIcon({ className }: IconProps) {
  return <i data-lucide="upload-cloud" className={className}></i>;
}

export function AlertCircle({ className }: IconProps) {
  return <i data-lucide="alert-circle" className={className}></i>;
}

export function Download({ className }: IconProps) {
  return <i data-lucide="download" className={className}></i>;
}

export function RefreshCw({ className }: IconProps) {
  return <i data-lucide="refresh-cw" className={className}></i>;
}

export function Edit3({ className }: IconProps) {
  return <i data-lucide="edit-3" className={className}></i>;
}

export function Mic({ className }: IconProps) {
  return <i data-lucide="mic" className={className}></i>;
}

export function MicOff({ className }: IconProps) {
  return <i data-lucide="mic-off" className={className}></i>;
}

export function X({ className }: IconProps) {
  return <i data-lucide="x" className={className}></i>;
}

export function Frame({ className }: IconProps) {
  return <i data-lucide="frame" className={className}></i>;
}

export function FileArchive({ className }: IconProps) {
  return <i data-lucide="file-archive" className={className}></i>;
}

export function Volume2({ className }: IconProps) {
  return <i data-lucide="volume-2" className={className}></i>;
}

export function BookOpen({ className }: IconProps) {
  return <i data-lucide="book-open" className={className}></i>;
}

export function Trash2({ className }: IconProps) {
  return <i data-lucide="trash-2" className={className}></i>;
}

export function Hammer({ className }: IconProps) {
  return <i data-lucide="hammer" className={className}></i>;
}

export function Anvil({ className }: IconProps) {
  return <i data-lucide="anvil" className={className}></i>;
}

export function History({ className }: IconProps) {
    return <i data-lucide="history" className={className}></i>;
}

export function PlusCircle({ className }: IconProps) {
    return <i data-lucide="plus-circle" className={className}></i>;
}