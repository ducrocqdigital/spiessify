import { Member, Penalty } from '@/types';

export const MOCK_MEMBERS: Member[] = [
  { id: '1', name: 'Max Müller', totalPenalties: 3, totalAmount: 25 },
  { id: '2', name: 'Anna Schmidt', totalPenalties: 1, totalAmount: 5 },
  { id: '3', name: 'Thomas Weber', totalPenalties: 5, totalAmount: 45 },
  { id: '4', name: 'Lisa Fischer', totalPenalties: 2, totalAmount: 20 },
  { id: '5', name: 'Stefan Bauer', totalPenalties: 4, totalAmount: 35 },
  { id: '6', name: 'Maria Wagner', totalPenalties: 1, totalAmount: 10 },
  { id: '7', name: 'Michael König', totalPenalties: 6, totalAmount: 55 },
  { id: '8', name: 'Sarah Richter', totalPenalties: 2, totalAmount: 15 },
  { id: '9', name: 'Daniel Braun', totalPenalties: 3, totalAmount: 30 },
  { id: '10', name: 'Julia Hoffmann', totalPenalties: 1, totalAmount: 15 },
  { id: '11', name: 'Christian Meyer', totalPenalties: 4, totalAmount: 40 },
  { id: '12', name: 'Nicole Klein', totalPenalties: 2, totalAmount: 25 },
  { id: '13', name: 'Marco Wolf', totalPenalties: 7, totalAmount: 65 },
  { id: '14', name: 'Sandra Neumann', totalPenalties: 1, totalAmount: 5 },
  { id: '15', name: 'Florian Schwarz', totalPenalties: 3, totalAmount: 35 },
  { id: '16', name: 'Petra Weiß', totalPenalties: 2, totalAmount: 20 },
  { id: '17', name: 'Oliver Zimmermann', totalPenalties: 5, totalAmount: 50 },
  { id: '18', name: 'Sabine Krüger', totalPenalties: 1, totalAmount: 10 },
  { id: '19', name: 'Andreas Hartmann', totalPenalties: 4, totalAmount: 45 },
  { id: '20', name: 'Claudia Lange', totalPenalties: 2, totalAmount: 25 }
];

export const MOCK_PENALTIES: Penalty[] = [
  {
    id: '1',
    memberId: '1',
    memberName: 'Max Müller',
    category: 'uniform',
    amount: 5,
    date: '2024-08-26',
    notes: 'Schmutzige Stiefel'
  },
  {
    id: '2',
    memberId: '3',
    memberName: 'Thomas Weber',
    category: 'marsch',
    amount: 10,
    date: '2024-08-26',
    notes: 'Aus dem Takt'
  },
  {
    id: '3',
    memberId: '7',
    memberName: 'Michael König',
    category: 'sonstiges',
    amount: 15,
    date: '2024-08-25',
    notes: 'Zu spät erschienen'
  },
  {
    id: '4',
    memberId: '13',
    memberName: 'Marco Wolf',
    category: 'uniform',
    amount: 5,
    date: '2024-08-25',
    notes: 'Falsche Mütze'
  },
  {
    id: '5',
    memberId: '5',
    memberName: 'Stefan Bauer',
    category: 'marsch',
    amount: 10,
    date: '2024-08-24',
    notes: 'Falsche Formation'
  }
];