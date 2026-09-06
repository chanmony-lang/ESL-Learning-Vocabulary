import React from 'react';
import {
  Sparkles,
  Layers,
  Keyboard,
  Network,
  CheckCircle2,
  Headphones,
  Zap,
  Fish,
  Mic,
  ArrowDownCircle,
  Swords,
  Anchor,
  Disc,
  Grid,
  FileSearch,
  Shuffle,
  AlignLeft,
  HelpCircle,
  Combine,
  Eye,
  GitCommit,
  SquareCode,
  LifeBuoy,
  Rocket,
  Sparkle,
  BookOpen,
  Languages,
  Boxes,
  Grid3X3,
  Table,
} from 'lucide-react';

interface Props {
  name: string;
  className?: string;
}

export const ModeIcon: React.FC<Props> = ({ name, className = 'w-5 h-5' }) => {
  switch (name) {
    case 'Boxes': return <Boxes className={className} />;
    case 'Grid3X3': return <Grid3X3 className={className} />;
    case 'Table': return <Table className={className} />;
    case 'Sparkles': return <Sparkles className={className} />;
    case 'Layers': return <Layers className={className} />;
    case 'Keyboard': return <Keyboard className={className} />;
    case 'Network': return <Network className={className} />;
    case 'CheckCircle2': return <CheckCircle2 className={className} />;
    case 'Headphones': return <Headphones className={className} />;
    case 'Zap': return <Zap className={className} />;
    case 'Fish': return <Fish className={className} />;
    case 'Mic': return <Mic className={className} />;
    case 'ArrowDownCircle': return <ArrowDownCircle className={className} />;
    case 'Swords': return <Swords className={className} />;
    case 'Anchor': return <Anchor className={className} />;
    case 'Disc': return <Disc className={className} />;
    case 'Grid': return <Grid className={className} />;
    case 'FileSearch': return <FileSearch className={className} />;
    case 'Shuffle': return <Shuffle className={className} />;
    case 'AlignLeft': return <AlignLeft className={className} />;
    case 'HelpCircle': return <HelpCircle className={className} />;
    case 'Combine': return <Combine className={className} />;
    case 'Eye': return <Eye className={className} />;
    case 'GitCommit': return <GitCommit className={className} />;
    case 'XSquare': return <SquareCode className={className} />;
    case 'LifeBuoy': return <LifeBuoy className={className} />;
    case 'Rocket': return <Rocket className={className} />;
    case 'Sparkle': return <Sparkle className={className} />;
    case 'BookOpen': return <BookOpen className={className} />;
    case 'Languages': return <Languages className={className} />;
    default: return <Sparkles className={className} />;
  }
};
