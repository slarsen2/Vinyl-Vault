import {
  db,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  addDoc
} from './firebase';
import { Record } from "@shared/schema";

// Interface for Firestore record document
export interface FirestoreRecord {
  id?: string;
  userId: string;
  title: string;
  artist: string;
  year?: string | null;
  genre?: string | null;
  coverImage?: string | null;
  customFields?: { [key: string]: string };
  createdAt: Date | Timestamp;
}

// Convert Firestore timestamp to Date
function convertTimestamps(data: any): any {
  if (!data) return data;
  
  if (data instanceof Timestamp) {
    return data.toDate();
  } else if (typeof data === 'object') {
    for (const key in data) {
      data[key] = convertTimestamps(data[key]);
    }
  }
  return data;
}

// Convert Firestore document to a Record
function convertFirestoreDocToRecord(doc: any): FirestoreRecord {
  const data = doc.data();
  return {
    id: doc.id,
    ...data,
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt
  };
}

// Records collection functions
export const recordsService = {
  // Get all records for a user
  async getRecords(userId: string): Promise<FirestoreRecord[]> {
    console.log("Fetching records for user:", userId);
    const recordsRef = collection(db, 'records');
    const q = query(
      recordsRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    try {
      const querySnapshot = await getDocs(q);
      console.log("Records found:", querySnapshot.docs.length);
      const records = querySnapshot.docs.map(doc => {
        console.log("Record data:", doc.id, doc.data());
        return convertFirestoreDocToRecord(doc);
      });
      console.log("Processed records:", records);
      return records;
    } catch (error) {
      console.error("Error fetching records:", error);
      throw error;
    }
  },

  // Get a single record by ID
  async getRecord(recordId: string): Promise<FirestoreRecord | null> {
    const recordRef = doc(db, 'records', recordId);
    const recordDoc = await getDoc(recordRef);
    
    if (recordDoc.exists()) {
      return convertFirestoreDocToRecord(recordDoc);
    }
    
    return null;
  },

  // Create a new record
  async createRecord(record: Omit<FirestoreRecord, 'id' | 'createdAt'>): Promise<FirestoreRecord> {
    const recordsRef = collection(db, 'records');
    const recordData = {
      ...record,
      createdAt: new Date()
    };
    
    const docRef = await addDoc(recordsRef, recordData);
    return {
      id: docRef.id,
      ...recordData
    };
  },

  // Update a record
  async updateRecord(recordId: string, updateData: Partial<FirestoreRecord>): Promise<void> {
    const recordRef = doc(db, 'records', recordId);
    // Remove id and createdAt from update data if present
    const { id, createdAt, ...data } = updateData;
    await updateDoc(recordRef, data);
  },

  // Delete a record
  async deleteRecord(recordId: string): Promise<void> {
    const recordRef = doc(db, 'records', recordId);
    await deleteDoc(recordRef);
  },

  // Search records for a user
  async searchRecords(userId: string, searchQuery: string): Promise<FirestoreRecord[]> {
    // Firebase doesn't support text search directly,
    // so this is a client-side implementation
    const allRecords = await this.getRecords(userId);
    const lowerQuery = searchQuery.toLowerCase();
    
    return allRecords.filter(record => 
      record.title.toLowerCase().includes(lowerQuery) ||
      record.artist.toLowerCase().includes(lowerQuery) ||
      (record.genre && record.genre.toLowerCase().includes(lowerQuery)) ||
      (record.year && record.year.toLowerCase().includes(lowerQuery))
    );
  }
};