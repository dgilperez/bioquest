import {
  FungiIcon,
  InsectaIcon,
  PlantaeIcon,
  AnimaliaIcon,
  AvesIcon,
  MolluscaIcon,
  ArthropodaIcon,
  ReptiliaIcon,
  MammaliaIcon,
  AmphibiaIcon,
  NematodaIcon,
  ChromistaIcon,
  VirusIcon,
  BacteriaIcon,
} from '@/components/icons/taxonomic';

export type TaxonIconName =
  | 'Animalia'
  | 'Plantae'
  | 'Fungi'
  | 'Mollusca'
  | 'Arachnida'
  | 'Insecta'
  | 'Aves'
  | 'Mammalia'
  | 'Reptilia'
  | 'Amphibia'
  | 'Arthropoda'
  | 'Nematoda'
  | 'Chromista'
  | 'Virus'
  | 'Bacteria';

interface TaxonIconProps {
  name: TaxonIconName;
  size?: number;
  className?: string;
  animate?: boolean;
}

/**
 * Maps taxon names to their corresponding animated icon components
 */
export function TaxonIcon({ name, size = 32, className = '', animate = true }: TaxonIconProps) {
  const iconMap: Record<TaxonIconName, JSX.Element> = {
    Fungi: <FungiIcon size={size} className={className} animate={animate} />,
    Insecta: <InsectaIcon size={size} className={className} animate={animate} />,
    Plantae: <PlantaeIcon size={size} className={className} animate={animate} />,
    Animalia: <AnimaliaIcon size={size} className={className} animate={animate} />,
    Aves: <AvesIcon size={size} className={className} animate={animate} />,
    Mollusca: <MolluscaIcon size={size} className={className} animate={animate} />,
    Arthropoda: <ArthropodaIcon size={size} className={className} animate={animate} />,
    Nematoda: <NematodaIcon size={size} className={className} animate={animate} />,
    Chromista: <ChromistaIcon size={size} className={className} animate={animate} />,
    Virus: <VirusIcon size={size} className={className} animate={animate} />,
    Bacteria: <BacteriaIcon size={size} className={className} animate={animate} />,
    // Fallback to Arthropoda for Arachnida (spiders are arthropods)
    Arachnida: <ArthropodaIcon size={size} className={className} animate={animate} />,
    Mammalia: <MammaliaIcon size={size} className={className} animate={animate} />,
    Reptilia: <ReptiliaIcon size={size} className={className} animate={animate} />,
    Amphibia: <AmphibiaIcon size={size} className={className} animate={animate} />,
  };

  return iconMap[name] || <AnimaliaIcon size={size} className={className} animate={animate} />;
}

/**
 * Check if a taxon name has an associated icon
 */
export function hasTaxonIcon(name: string): name is TaxonIconName {
  const validNames: TaxonIconName[] = [
    'Animalia',
    'Plantae',
    'Fungi',
    'Mollusca',
    'Arachnida',
    'Insecta',
    'Aves',
    'Mammalia',
    'Reptilia',
    'Amphibia',
    'Arthropoda',
    'Nematoda',
    'Chromista',
    'Virus',
    'Bacteria',
  ];
  return validNames.includes(name as TaxonIconName);
}
