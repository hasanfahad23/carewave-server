// Helper to create dates relative to today
const getFutureDate = (daysAhead: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  d.setHours(10, 0, 0, 0);
  return d.toISOString();
};

export const initialEvents = [
  {
    title: "Winter Clothes Distribution – Mirpur 10",
    description: "Join our annual winter warmth drive! We are collecting and distributing warm jackets, sweaters, and thermals to underprivileged families, rickshaw pullers, and street vendors across Mirpur 10 and surrounding areas.",
    eventType: "Donation",
    thumbnail: "https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=1200&q=80",
    location: "Mirpur 10 Roundabout, Dhaka",
    eventDate: getFutureDate(3),
    creatorEmail: "organizer@carewave.org",
    creatorName: "CareWave Community Relief",
    creatorPhoto: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80",
    participantCount: 34,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    title: "Blanket Distribution for the Needy – Mohammadpur",
    description: "Distributing 500+ high-quality thermal blankets to vulnerable homeless populations, orphanages, and elderly citizens sleeping on sidewalks in Mohammadpur, Town Hall, and Geneva Camp areas.",
    eventType: "Donation",
    thumbnail: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=1200&q=80",
    location: "Mohammadpur Town Hall Ground, Dhaka",
    eventDate: getFutureDate(6),
    creatorEmail: "relief@carewave.org",
    creatorName: "Dhaka Hope Foundation",
    creatorPhoto: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80",
    participantCount: 42,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    title: "Green Urban Movement: 1,000 Tree Plantation",
    description: "Help us combat urban heat islands by planting 1,000 native neem, mahogany, and fruit saplings across public parks, school boundaries, and residential walkways in Ramna and Shahbagh.",
    eventType: "Plantation",
    thumbnail: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=1200&q=80",
    location: "Ramna Park Gate 3, Dhaka",
    eventDate: getFutureDate(10),
    creatorEmail: "green@carewave.org",
    creatorName: "EcoWarriors Bangladesh",
    creatorPhoto: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&q=80",
    participantCount: 78,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    title: "Buriganga Riverbank Clean-Up & Plastic Interception",
    description: "A community-led environmental sanitation drive aimed at collecting single-use plastics, polythene bags, and non-biodegradable waste along the Sadarghat riverfront. Protective gloves and bags provided.",
    eventType: "Cleanup",
    thumbnail: "https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?auto=format&fit=crop&w=1200&q=80",
    location: "Sadarghat Launch Terminal Ghat, Dhaka",
    eventDate: getFutureDate(14),
    creatorEmail: "cleanup@carewave.org",
    creatorName: "Clean Rivers Initiative",
    creatorPhoto: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80",
    participantCount: 56,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    title: "Street Children Education & Backpack Distribution",
    description: "Providing school stationery, illustrated storybooks, geometry sets, and nutritious snack packs to over 200 disadvantaged street children in Farmgate. Volunteers will also conduct basic literacy workshops.",
    eventType: "Education",
    thumbnail: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=1200&q=80",
    location: "Farmgate Overbridge Community Center, Dhaka",
    eventDate: getFutureDate(18),
    creatorEmail: "teach@carewave.org",
    creatorName: "Youth Literacy Alliance",
    creatorPhoto: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=256&q=80",
    participantCount: 29,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    title: "Free Community Health, Blood Glucose & Eye Screening Camp",
    description: "Volunteer doctors, nurses, and medical students providing free general health checkups, blood pressure measurements, diabetic screening, and free prescription glasses for underprivileged domestic workers.",
    eventType: "Healthcare",
    thumbnail: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=80",
    location: "Dhanmondi Lake Amphitheater Grounds, Dhaka",
    eventDate: getFutureDate(22),
    creatorEmail: "health@carewave.org",
    creatorName: "Doctors for Humanity",
    creatorPhoto: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=256&q=80",
    participantCount: 65,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    title: "Voluntary Blood Donation Drive & Thalassemia Support",
    description: "Organizing an emergency voluntary blood donation camp in collaboration with the Red Crescent Society to replenish blood banks for critical thalassemia patients and trauma victims.",
    eventType: "Blood Donation",
    thumbnail: "https://images.unsplash.com/photo-1615461066841-6116e61058f4?auto=format&fit=crop&w=1200&q=80",
    location: "Dhaka University TSC Auditorium, Dhaka",
    eventDate: getFutureDate(28),
    creatorEmail: "organizer@carewave.org",
    creatorName: "CareWave Community Relief",
    creatorPhoto: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80",
    participantCount: 91,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];
