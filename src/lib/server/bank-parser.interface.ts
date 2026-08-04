import { Transaction } from './transaction.interface';

export interface BankParser {
  bankName: string;
  canParse(text: string): boolean;
  parse(text: string, sourceFile: string): Transaction[];
}
