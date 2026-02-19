// Random data generator for widgets

const firstNames = [
  'John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'Robert', 'Jessica',
  'William', 'Ashley', 'James', 'Amanda', 'Christopher', 'Melissa', 'Daniel',
  'Michelle', 'Matthew', 'Kimberly', 'Anthony', 'Amy', 'Mark', 'Angela',
  'Donald', 'Stephanie', 'Steven', 'Nicole', 'Paul', 'Elizabeth', 'Andrew',
  'Helen', 'Joshua', 'Sandra', 'Kenneth', 'Donna', 'Kevin', 'Carol', 'Brian',
  'Ruth', 'George', 'Sharon', 'Edward', 'Michelle', 'Ronald', 'Laura',
  'Timothy', 'Sarah', 'Jason', 'Kimberly', 'Jeffrey', 'Deborah'
];

const lastNames = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller',
  'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Wilson', 'Anderson',
  'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Thompson', 'White',
  'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker',
  'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill',
  'Flores', 'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell'
];

const taskTitles = [
  'Follow up with client', 'Review contract', 'Schedule meeting', 'Send proposal',
  'Update CRM records', 'Prepare presentation', 'Contact lead', 'Process payment',
  'Schedule demo', 'Send invoice', 'Review documents', 'Update status',
  'Client onboarding', 'Contract negotiation', 'Product demo', 'Technical support'
];

const clientNames = [
  'Acme Corporation', 'Tech Solutions Inc', 'Global Industries', 'Digital Services',
  'Innovation Labs', 'Future Systems', 'Smart Solutions', 'Prime Technologies',
  'Elite Business Group', 'Advanced Systems', 'Modern Enterprises', 'NextGen Corp',
  'Strategic Partners', 'Dynamic Solutions', 'Proactive Industries', 'Visionary Tech'
];

export const generateRandomName = (): string => {
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  return `${firstName} ${lastName}`;
};

export const generateManagerTasksData = () => {
  const users = [];
  for (let i = 0; i < 10; i++) {
    users.push({
      userName: generateRandomName(),
      openTasks: Math.floor(Math.random() * 50) + 1,
      overdue: Math.floor(Math.random() * 20),
      dueToday: Math.floor(Math.random() * 10),
      oldestOverdue: Math.floor(Math.random() * 30) + 1,
      completedYesterday: Math.floor(Math.random() * 15),
    });
  }
  return users;
};

export const generateSpecialistTasksData = (tab: 'all' | 'overdue' | 'dueToday') => {
  const count = tab === 'all' ? 15 : tab === 'overdue' ? 8 : 5;
  const tasks = [];
  
  for (let i = 0; i < count; i++) {
    const dueDate = new Date();
    if (tab === 'overdue') {
      dueDate.setDate(dueDate.getDate() - Math.floor(Math.random() * 10) - 1);
    } else if (tab === 'dueToday') {
      // Keep today's date
    } else {
      dueDate.setDate(dueDate.getDate() + Math.floor(Math.random() * 20) - 5);
    }
    
    tasks.push({
      clientName: clientNames[Math.floor(Math.random() * clientNames.length)],
      taskTitle: taskTitles[Math.floor(Math.random() * taskTitles.length)],
      dueDate: dueDate.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      }),
    });
  }
  
  return tasks;
};

export const generateTotalsData = () => {
  return {
    openTasks: Math.floor(Math.random() * 200) + 50,
    overdue: Math.floor(Math.random() * 50) + 10,
    dueToday: Math.floor(Math.random() * 20) + 5,
    oldestOverdue: Math.floor(Math.random() * 30) + 1,
    completedYesterday: Math.floor(Math.random() * 40) + 10,
  };
};

export const generateSalesReportData = (period: 'today' | 'yesterday' | 'week' | 'month') => {
  const multipliers = {
    today: 1,
    yesterday: 0.8,
    week: 5,
    month: 20,
  };
  
  const multiplier = multipliers[period];
  
  return {
    calls: Math.floor(Math.random() * 50 * multiplier) + 10 * multiplier,
    answered: Math.floor(Math.random() * 40 * multiplier) + 8 * multiplier,
    conversations: Math.floor(Math.random() * 30 * multiplier) + 5 * multiplier,
    interestedClients: Math.floor(Math.random() * 15 * multiplier) + 3 * multiplier,
    dealsClosed: Math.floor(Math.random() * 10 * multiplier) + 2 * multiplier,
    totalContractAmount: Math.floor(Math.random() * 500000 * multiplier) + 50000 * multiplier,
    firstPaymentAmount: Math.floor(Math.random() * 100000 * multiplier) + 10000 * multiplier,
  };
};

export const getCurrentDate = (): string => {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

