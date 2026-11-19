import { MongoClient, Db, ObjectId } from 'mongodb';
import dotenv from 'dotenv';
import { initialEvents } from '../data/seedData';
import { IEvent, IUser, IEventJoin } from '../types';

dotenv.config();

const uri = process.env.MONGODB_URI || '';
const dbName = process.env.DB_NAME || 'carewave_db';

let db: Db | null = null;
let client: MongoClient | null = null;

// In-Memory store fallback in case MONGODB_URI is not provided or offline
class MemoryCollection<T extends { _id?: string }> {
  private items: T[] = [];

  constructor(initialData: T[] = []) {
    this.items = [...initialData];
  }

  async find(filter: any = {}): Promise<{
    toArray: () => Promise<T[]>;
    sort: (sortObj: any) => { toArray: () => Promise<T[]>; limit: (n: number) => { toArray: () => Promise<T[]> } };
    limit: (n: number) => { toArray: () => Promise<T[]> };
  }> {
    let result = this.items.filter(item => {
      for (const key of Object.keys(filter)) {
        if (key === '$or' && Array.isArray(filter.$or)) {
          const matchesAny = filter.$or.some((subFilter: any) => {
            return Object.keys(subFilter).some(subKey => {
              if (subFilter[subKey] instanceof RegExp) {
                return subFilter[subKey].test((item as any)[subKey] || '');
              }
              return (item as any)[subKey] === subFilter[subKey];
            });
          });
          if (!matchesAny) return false;
          continue;
        }

        if (filter[key] instanceof RegExp) {
          if (!filter[key].test((item as any)[key] || '')) return false;
          continue;
        }

        if (filter[key] && typeof filter[key] === 'object') {
          if ('$gte' in filter[key]) {
            if (!((item as any)[key] >= filter[key].$gte)) return false;
          }
          if ('$lte' in filter[key]) {
            if (!((item as any)[key] <= filter[key].$lte)) return false;
          }
          if ('$ne' in filter[key]) {
            if ((item as any)[key] === filter[key].$ne) return false;
          }
          continue;
        }

        if ((item as any)[key] !== filter[key]) return false;
      }
      return true;
    });

    const sortFn = (sortObj: any) => {
      const keys = Object.keys(sortObj);
      if (keys.length === 0) return result;
      const key = keys[0];
      const dir = sortObj[key] >= 0 ? 1 : -1;
      return [...result].sort((a: any, b: any) => {
        if (a[key] > b[key]) return dir;
        if (a[key] < b[key]) return -dir;
        return 0;
      });
    };

    return {
      toArray: async () => [...result],
      sort: (sortObj: any) => {
        const sorted = sortFn(sortObj);
        return {
          toArray: async () => [...sorted],
          limit: (n: number) => ({
            toArray: async () => sorted.slice(0, n)
          })
        };
      },
      limit: (n: number) => ({
        toArray: async () => result.slice(0, n)
      })
    };
  }

  async findOne(filter: any): Promise<T | null> {
    const list = await (await this.find(filter)).toArray();
    return list[0] || null;
  }

  async insertOne(doc: T): Promise<{ insertedId: string; acknowledged: boolean }> {
    const id = doc._id || new ObjectId().toString();
    const itemWithId = { ...doc, _id: id };
    this.items.push(itemWithId);
    return { insertedId: id, acknowledged: true };
  }

  async updateOne(filter: any, update: any): Promise<{ modifiedCount: number; matchedCount: number }> {
    const item = await this.findOne(filter);
    if (!item) return { modifiedCount: 0, matchedCount: 0 };
    
    if (update.$set) {
      Object.assign(item, update.$set);
    }
    if (update.$inc) {
      for (const k of Object.keys(update.$inc)) {
        (item as any)[k] = ((item as any)[k] || 0) + update.$inc[k];
      }
    }
    return { modifiedCount: 1, matchedCount: 1 };
  }

  async deleteOne(filter: any): Promise<{ deletedCount: number }> {
    const index = this.items.findIndex(item => {
      for (const key of Object.keys(filter)) {
        if ((item as any)[key] !== filter[key]) return false;
      }
      return true;
    });
    if (index === -1) return { deletedCount: 0 };
    this.items.splice(index, 1);
    return { deletedCount: 1 };
  }

  async deleteMany(filter: any): Promise<{ deletedCount: number }> {
    const initialLen = this.items.length;
    this.items = this.items.filter(item => {
      for (const key of Object.keys(filter)) {
        if ((item as any)[key] === filter[key]) return false;
      }
      return true;
    });
    return { deletedCount: initialLen - this.items.length };
  }

  async countDocuments(filter: any = {}): Promise<number> {
    const list = await (await this.find(filter)).toArray();
    return list.length;
  }
}

// Memory collections instances
const memoryEvents = new MemoryCollection<IEvent>(
  initialEvents.map((evt) => ({
    ...evt,
    _id: new ObjectId().toString()
  })) as IEvent[]
);
const memoryUsers = new MemoryCollection<IUser>();
const memoryJoins = new MemoryCollection<IEventJoin>();

let isUsingRealMongo = false;

export const connectDB = async () => {
  if (uri) {
    try {
      console.log('Connecting to MongoDB Atlas...');
      client = new MongoClient(uri);
      await client.connect();
      db = client.db(dbName);
      isUsingRealMongo = true;
      console.log(`Connected to MongoDB Atlas Database: ${dbName}`);

      // Seed initial events if database is empty
      const eventsCount = await db.collection('events').countDocuments();
      if (eventsCount === 0) {
        console.log('Seeding initial community events to MongoDB...');
        await db.collection('events').insertMany(initialEvents);
        console.log('Seeded 7 initial events successfully.');
      }
      return db;
    } catch (error) {
      console.warn('MongoDB connection failed. Falling back to robust in-memory database:', error);
      isUsingRealMongo = false;
    }
  } else {
    console.log('No MONGODB_URI found in environment. Using in-memory fallback database with pre-seeded events.');
    isUsingRealMongo = false;
  }
  return null;
};

// Generic Collection Accessors
export const getEventsCollection = () => {
  if (isUsingRealMongo && db) {
    return db.collection<IEvent>('events');
  }
  return memoryEvents;
};

export const getUsersCollection = () => {
  if (isUsingRealMongo && db) {
    return db.collection<IUser>('users');
  }
  return memoryUsers;
};

export const getJoinsCollection = () => {
  if (isUsingRealMongo && db) {
    return db.collection<IEventJoin>('event_joins');
  }
  return memoryJoins;
};
