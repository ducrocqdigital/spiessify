import { Member } from '@/types';

// Zustände eines Uniformteils bei der Musterung
export type PartState = 'fehlt' | 'versaut' | 'dreckig' | 'unzureichend' | 'ungepflegt';

export const STATE_LABELS: Record<PartState, string> = {
  fehlt: 'Fehlt',
  versaut: 'Versaut',
  dreckig: 'Dreckig',
  unzureichend: 'Unzureichend',
  ungepflegt: 'Ungepflegt'
};

// Welcher Katalogeintrag gilt für welchen Zustand
// (special: Nadeln und Eichenlaub haben eigene "fehlt"-Einträge)
export const STATE_CATALOG_NAMES: Record<Exclude<PartState, 'fehlt'>, string> = {
  versaut: 'Versautes Uniformteil',
  dreckig: 'Dreckiges Uniformteil',
  unzureichend: 'Unzureichendes Uniformteil',
  ungepflegt: 'Ungepflegt'
};

export interface UniformPart {
  key: string;
  label: string;
  zone: 'kopf' | 'oberkoerper' | 'unten' | 'ausruestung' | 'person';
  // Katalogname für Zustand "fehlt" (Standard: "Fehlendes Uniformteil")
  missingCatalogName?: string;
  // Nur dieser eine Zustand möglich (z.B. Ungepflegt)
  singleState?: PartState;
}

export const ZONE_LABELS: Record<UniformPart['zone'], string> = {
  kopf: 'Kopf',
  oberkoerper: 'Oberkörper',
  unten: 'Unten',
  ausruestung: 'Ausrüstung',
  person: 'Person'
};

const CHARGIERTE_RANKS = ['feldwebel', 'leutnant', 'oberleutnant'];

// Teileliste je nach Rang der gemusterten Person
export function partsForMember(member: Member): UniformPart[] {
  const rank = (member.rank || '').toLowerCase();
  const isChargierter = CHARGIERTE_RANKS.includes(rank);
  const hasFeldbinde = rank === 'leutnant' || rank === 'oberleutnant';

  const parts: UniformPart[] = [
    // Kopf
    { key: 'hut', label: 'Hut', zone: 'kopf' },
    { key: 'feder', label: 'Feder', zone: 'kopf' },
    { key: 'kokarde', label: 'Kokarde', zone: 'kopf' },

    // Oberkörper
    { key: 'schuetzenrock', label: 'Schützenrock', zone: 'oberkoerper' },
    { key: 'krawatte', label: 'Krawatte', zone: 'oberkoerper' },
    { key: 'hemd', label: 'Hemd', zone: 'oberkoerper' },
    { key: 'guertel', label: 'Gürtel', zone: 'oberkoerper' },
    { key: 'eichenlaub_gold', label: 'Goldenes Eichenlaub', zone: 'oberkoerper', missingCatalogName: 'Fehlendes Eichenlaub' },
    { key: 'korpsnadel', label: 'Korpsnadel', zone: 'oberkoerper', missingCatalogName: 'Fehlende Nadel' },
    { key: 'zugnadel', label: 'Zugnadel', zone: 'oberkoerper', missingCatalogName: 'Fehlende Nadel' },
    ...(hasFeldbinde ? [{ key: 'feldbinde', label: 'Feldbinde', zone: 'oberkoerper' } as UniformPart] : []),

    // Unten
    { key: 'hose', label: 'Hose', zone: 'unten' },
    { key: 'schuhe', label: 'Schuhe', zone: 'unten' },
    { key: 'socken', label: 'Socken', zone: 'unten' },

    // Ausrüstung
    ...(isChargierter
      ? [{ key: 'loewenkopfsaebel', label: 'Löwenkopfsäbel', zone: 'ausruestung' } as UniformPart]
      : [
          { key: 'gewehr', label: 'Gewehr', zone: 'ausruestung' } as UniformPart,
          { key: 'eichenlaub_gewehr', label: 'Eichenlaub', zone: 'ausruestung', missingCatalogName: 'Fehlendes Eichenlaub' } as UniformPart
        ]),
    { key: 'handschuhe', label: 'Handschuhe', zone: 'ausruestung' },

    // Person
    { key: 'ungepflegt', label: 'Ungepflegt', zone: 'person', singleState: 'ungepflegt' }
  ];

  return parts;
}

// Katalogeintrag für Teil+Zustand finden
export function catalogEntryFor(part: UniformPart, state: PartState, catalog: any[]): any | undefined {
  let name: string;
  if (state === 'fehlt') {
    name = part.missingCatalogName || 'Fehlendes Uniformteil';
  } else {
    name = STATE_CATALOG_NAMES[state];
  }
  return catalog.find(c => c.name === name && c.is_active);
}

// Anzeigepreis für Teil+Zustand
export function priceFor(part: UniformPart, state: PartState, catalog: any[]): number {
  const entry = catalogEntryFor(part, state, catalog);
  return entry ? Number(entry.amount) : 0;
}
