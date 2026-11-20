import { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { getEventsCollection, getJoinsCollection } from '../config/db';
import { AuthRequest, IEvent, IEventJoin } from '../types';

// Helper to convert string to ObjectId if valid
const toObjectId = (id: string): ObjectId | string => {
  if (ObjectId.isValid(id) && id.length === 24) {
    try {
      return new ObjectId(id);
    } catch {
      return id;
    }
  }
  return id;
};

// GET /api/events/recent
// Requirements: Show 6 recent upcoming events using .limit() operator of mongodb based on date
export const getRecentEvents = async (req: Request, res: Response): Promise<void> => {
  try {
    const eventsCol = getEventsCollection();
    const nowIso = new Date().toISOString();

    // Query upcoming events (eventDate >= nowIso) sorted by eventDate ascending, limit 6
    const cursor = await eventsCol.find({
      eventDate: { $gte: nowIso.substring(0, 10) }
    });

    const recentEvents = await cursor.sort({ eventDate: 1 }).limit(6).toArray();

    // If less than 6 found due to strict date, fallback to any available events sorted by date
    let results = recentEvents;
    if (results.length < 6) {
      const allCursor = await eventsCol.find({});
      results = await allCursor.sort({ eventDate: 1 }).limit(6).toArray();
    }

    res.status(200).json({
      success: true,
      count: results.length,
      data: results
    });
  } catch (error: any) {
    console.error('Error fetching recent events:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch recent events.', error: error.message });
  }
};

// GET /api/events
// Requirements: Show all upcoming events in grid layout. Events whose dates have passed must not appear.
export const getAllUpcomingEvents = async (req: Request, res: Response): Promise<void> => {
  try {
    const eventsCol = getEventsCollection();
    const { search, type, sort = 'asc' } = req.query;
    const today = new Date().toISOString().substring(0, 10);

    const filter: any = {
      eventDate: { $gte: today }
    };

    if (type && type !== 'All') {
      filter.eventType = type;
    }

    if (search && typeof search === 'string' && search.trim() !== '') {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { title: regex },
        { location: regex },
        { description: regex }
      ];
    }

    const sortOrder = sort === 'desc' ? -1 : 1;
    const cursor = await eventsCol.find(filter);
    const events = await cursor.sort({ eventDate: sortOrder }).toArray();

    res.status(200).json({
      success: true,
      count: events.length,
      data: events
    });
  } catch (error: any) {
    console.error('Error fetching upcoming events:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch events.', error: error.message });
  }
};

// GET /api/events/:id
// Requirements: View Event details page. Public page. Can see details without logging in.
export const getEventById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const eventsCol = getEventsCollection();

    let event: any = await eventsCol.findOne({ _id: toObjectId(id) as any });
    if (!event) {
      // try as string
      event = await eventsCol.findOne({ _id: id as any });
    }

    if (!event) {
      res.status(404).json({ success: false, message: 'Event not found.' });
      return;
    }

    // Optional user email check from query if present
    const userEmail = (req.query.userEmail as string)?.toLowerCase();
    let hasJoined = false;

    if (userEmail) {
      const joinsCol = getJoinsCollection();
      const existingJoin = await joinsCol.findOne({
        eventId: event._id.toString(),
        userEmail
      });
      if (existingJoin) hasJoined = true;
    }

    res.status(200).json({
      success: true,
      data: {
        ...event,
        hasJoined
      }
    });
  } catch (error: any) {
    console.error('Error fetching event details:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch event details.', error: error.message });
  }
};

// POST /api/events
// Requirements: Any logged-in user can create. Title, description, event type, thumbnail, location, event date (future only).
// User email stored with event. Success message and redirect.
export const createEvent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Please log in to create an event.' });
      return;
    }

    const { title, description, eventType, thumbnail, location, eventDate } = req.body;

    // Validation
    if (!title?.trim() || !description?.trim() || !eventType || !location?.trim() || !eventDate) {
      res.status(400).json({ success: false, message: 'All fields (title, description, event type, location, date) are required.' });
      return;
    }

    // Future date validation:
    // "Ensure that no past date can be added. The date must be in the future."
    const inputDate = new Date(eventDate);
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    if (isNaN(inputDate.getTime()) || inputDate < currentDate) {
      res.status(400).json({ success: false, message: 'Event date must be in the future. Past dates are not allowed.' });
      return;
    }

    const eventsCol = getEventsCollection();

    const newEvent: IEvent = {
      title: title.trim(),
      description: description.trim(),
      eventType,
      thumbnail: thumbnail?.trim() || 'https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=1200&q=80',
      location: location.trim(),
      eventDate: new Date(eventDate).toISOString(),
      creatorEmail: req.user.email.toLowerCase(),
      creatorName: req.user.name,
      participantCount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await eventsCol.insertOne(newEvent);

    res.status(201).json({
      success: true,
      message: 'Event created successfully!',
      data: {
        ...newEvent,
        _id: result.insertedId.toString()
      }
    });
  } catch (error: any) {
    console.error('Error creating event:', error);
    res.status(500).json({ success: false, message: 'Server error creating event.', error: error.message });
  }
};

// PUT /api/events/:id
// Requirements: Users can only delete and update their own created event data.
export const updateEvent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }

    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { title, description, eventType, thumbnail, location, eventDate } = req.body;

    const eventsCol = getEventsCollection();
    let existingEvent: any = await eventsCol.findOne({ _id: toObjectId(id) as any });
    if (!existingEvent) {
      existingEvent = await eventsCol.findOne({ _id: id as any });
    }

    if (!existingEvent) {
      res.status(404).json({ success: false, message: 'Event not found.' });
      return;
    }

    // Ownership check:
    if (existingEvent.creatorEmail?.toLowerCase() !== req.user.email.toLowerCase()) {
      res.status(403).json({ success: false, message: 'Unauthorized. You can only update events you created.' });
      return;
    }

    // Date validation if provided
    if (eventDate) {
      const inputDate = new Date(eventDate);
      const currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0);
      if (isNaN(inputDate.getTime()) || inputDate < currentDate) {
        res.status(400).json({ success: false, message: 'Event date must be in the future. Past dates are not allowed.' });
        return;
      }
    }

    const updateFields: any = {
      updatedAt: new Date()
    };

    if (title) updateFields.title = title.trim();
    if (description) updateFields.description = description.trim();
    if (eventType) updateFields.eventType = eventType;
    if (thumbnail) updateFields.thumbnail = thumbnail.trim();
    if (location) updateFields.location = location.trim();
    if (eventDate) updateFields.eventDate = new Date(eventDate).toISOString();

    const queryFilter: any = existingEvent._id instanceof ObjectId ? { _id: existingEvent._id } : { _id: existingEvent._id.toString() };
    await eventsCol.updateOne(queryFilter, { $set: updateFields });

    const updatedEvent = await eventsCol.findOne(queryFilter);

    res.status(200).json({
      success: true,
      message: 'Event updated successfully!',
      data: updatedEvent
    });
  } catch (error: any) {
    console.error('Error updating event:', error);
    res.status(500).json({ success: false, message: 'Server error updating event.', error: error.message });
  }
};

// DELETE /api/events/:id
// Requirements: Users can only delete their own created event data.
export const deleteEvent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }

    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const eventsCol = getEventsCollection();

    let existingEvent: any = await eventsCol.findOne({ _id: toObjectId(id) as any });
    if (!existingEvent) {
      existingEvent = await eventsCol.findOne({ _id: id as any });
    }

    if (!existingEvent) {
      res.status(404).json({ success: false, message: 'Event not found.' });
      return;
    }

    // Ownership check:
    if (existingEvent.creatorEmail?.toLowerCase() !== req.user.email.toLowerCase()) {
      res.status(403).json({ success: false, message: 'Unauthorized. You can only delete events you created.' });
      return;
    }

    const queryFilter: any = existingEvent._id instanceof ObjectId ? { _id: existingEvent._id } : { _id: existingEvent._id.toString() };
    await eventsCol.deleteOne(queryFilter);

    // Also delete any join records for this event
    const joinsCol = getJoinsCollection();
    await joinsCol.deleteMany({ eventId: existingEvent._id.toString() });

    res.status(200).json({
      success: true,
      message: 'Event deleted successfully.'
    });
  } catch (error: any) {
    console.error('Error deleting event:', error);
    res.status(500).json({ success: false, message: 'Server error deleting event.', error: error.message });
  }
};

// GET /api/events/user/created
// Requirements: Manage Events page: user can see all events created by them
export const getUserCreatedEvents = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }

    const eventsCol = getEventsCollection();
    const cursor = await eventsCol.find({ creatorEmail: req.user.email.toLowerCase() });
    const events = await cursor.sort({ createdAt: -1 }).toArray();

    // Attach participants list to each event for the creator
    const joinsCol = getJoinsCollection();
    const eventsWithParticipants = await Promise.all(
      events.map(async (evt) => {
        const evtId = evt._id ? evt._id.toString() : '';
        const joins = await (await joinsCol.find({ eventId: evtId })).toArray();
        return {
          ...evt,
          volunteers: joins.map((j) => ({
            name: j.userName,
            email: j.userEmail,
            photo: j.userPhoto,
            joinedAt: j.joinedAt
          }))
        };
      })
    );

    res.status(200).json({
      success: true,
      count: eventsWithParticipants.length,
      data: eventsWithParticipants
    });
  } catch (error: any) {
    console.error('Error fetching user created events:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch user events.', error: error.message });
  }
};

// POST /api/events/:id/join
// Requirements: Users will be able to join an event by clicking the Join Event button, and it must be functional.
// Store data in database along with event and user data. Must be logged in.
export const joinEvent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Please log in to join this event.' });
      return;
    }

    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const eventsCol = getEventsCollection();
    const joinsCol = getJoinsCollection();

    let event: any = await eventsCol.findOne({ _id: toObjectId(id) as any });
    if (!event) {
      event = await eventsCol.findOne({ _id: id as any });
    }

    if (!event) {
      res.status(404).json({ success: false, message: 'Event not found.' });
      return;
    }

    const eventIdStr = event._id.toString();

    // Check if user already joined
    const alreadyJoined = await joinsCol.findOne({
      eventId: eventIdStr,
      userEmail: req.user.email.toLowerCase()
    });

    if (alreadyJoined) {
      res.status(400).json({ success: false, message: 'You have already joined this event!' });
      return;
    }

    const newJoin: IEventJoin = {
      eventId: eventIdStr,
      eventTitle: event.title,
      eventType: event.eventType,
      thumbnail: event.thumbnail,
      location: event.location,
      eventDate: event.eventDate,
      userEmail: req.user.email.toLowerCase(),
      userName: req.user.name,
      joinedAt: new Date()
    };

    await joinsCol.insertOne(newJoin);

    // Increment participant count in the event
    const queryFilter: any = event._id instanceof ObjectId ? { _id: event._id } : { _id: event._id.toString() };
    await eventsCol.updateOne(queryFilter, {
      $inc: { participantCount: 1 }
    });

    res.status(201).json({
      success: true,
      message: 'You have successfully joined the event! See you there volunteer.',
      data: newJoin
    });
  } catch (error: any) {
    console.error('Error joining event:', error);
    res.status(500).json({ success: false, message: 'Failed to join event.', error: error.message });
  }
};

// DELETE /api/events/:id/join
// User cancels/leaves joined event
export const leaveEvent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }

    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const joinsCol = getJoinsCollection();
    const eventsCol = getEventsCollection();

    const joinRecord = await joinsCol.findOne({
      eventId: id,
      userEmail: req.user.email.toLowerCase()
    });

    if (!joinRecord) {
      res.status(404).json({ success: false, message: 'You have not joined this event.' });
      return;
    }

    await joinsCol.deleteOne({
      eventId: id,
      userEmail: req.user.email.toLowerCase()
    });

    // Decrement participant count
    await eventsCol.updateOne({ _id: toObjectId(id) as any }, {
      $inc: { participantCount: -1 }
    });

    res.status(200).json({
      success: true,
      message: 'You have cancelled your participation for this event.'
    });
  } catch (error: any) {
    console.error('Error leaving event:', error);
    res.status(500).json({ success: false, message: 'Failed to cancel participation.', error: error.message });
  }
};

// GET /api/events/user/joined
// Requirements: Joined Events Page (Private Page): show all events joined by the logged-in user. Show events sorted by event date.
export const getUserJoinedEvents = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }

    const joinsCol = getJoinsCollection();
    const cursor = await joinsCol.find({ userEmail: req.user.email.toLowerCase() });

    // Sorted by event date
    const joinedEvents = await cursor.sort({ eventDate: 1 }).toArray();

    res.status(200).json({
      success: true,
      count: joinedEvents.length,
      data: joinedEvents
    });
  } catch (error: any) {
    console.error('Error fetching joined events:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch joined events.', error: error.message });
  }
};
