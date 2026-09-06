export const APP_CONSTANTS = {
  APP_NAME: 'BusTicket',

  STORAGE_KEYS: {
    AUTH_TOKEN: 'authToken',
    LOGGED_IN_USER: 'loggedInUser'
  },

  ROLES: {
    CUSTOMER: 'CUSTOMER',
    ADMIN: 'ADMIN',
    BUS_OPERATOR: 'BUS_OPERATOR',
    SUPPORT_AGENT: 'SUPPORT_AGENT'
  },

  GENDER_OPTIONS: [
    'MALE',
    'FEMALE',
    'OTHER'
  ],

  ID_TYPE_OPTIONS: [
    'AADHAAR',
    'PASSPORT',
    'DRIVING_LICENSE',
    'VOTER_ID'
  ],

  PAYMENT_METHOD_OPTIONS: [
    'UPI',
    'WALLET'
  ],

  STAFF_ROLE_OPTIONS: [
    'BUS_OPERATOR',
    'SUPPORT_AGENT'
  ]
} as const;

export const APP_ROUTES = {
  HOME: '',
  LOGIN: 'login',
  REGISTER: 'register',
  SEARCH: 'search',
  TRIP_DETAILS: 'trip',
  BOOKING: 'booking',
  PAYMENT: 'payment',
  BOOKING_CONFIRMATION: 'booking-confirmation',
  TICKETS: 'tickets',
  MY_BOOKINGS: 'my-bookings',
  SAVED_PASSENGERS: 'saved-passengers',
  REVIEWS: 'reviews',
  NOTIFICATIONS: 'notifications',
  PROFILE: 'profile',
  ADMIN: 'admin',
  OPERATOR: 'operator'
} as const;