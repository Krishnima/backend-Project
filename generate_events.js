const { faker } = require('@faker-js/faker');
const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const eventTypes = ['view', 'click', 'location'];

async function generateEvents(n = 2000) {
  const client = await pool.connect();
  try {
    for (let i = 0; i < n; i++) {
      const user_id = `user_${faker.string.uuid().slice(0, 8)}`;
      const event_type = faker.helpers.arrayElement(eventTypes);
      const timestamp = faker.date.between({ from: '2025-05-01T00:00:00Z', to: '2025-05-29T23:59:59Z' });
      let payload = {};

      if (event_type === 'view') {
        payload = {
          url: faker.internet.url(),
          title: faker.lorem.sentence()
        };
      } else if (event_type === 'click') {
        payload = {
          element_id: faker.string.alphanumeric(10),
          text: faker.lorem.words(2),
          xpath: `/html/body/div[${faker.number.int({ min: 1, max: 10 })}]`
        };
      } else if (event_type === 'location') {
        payload = {
          latitude: faker.location.latitude(),
          longitude: faker.location.longitude(),
          accuracy: faker.number.float({ min: 5, max: 50, precision: 0.1 })
        };
      }

      await client.query(
        'INSERT INTO events (event_id, user_id, event_type, timestamp, payload) VALUES ($1, $2, $3, $4, $5)',
        [uuidv4(), user_id, event_type, timestamp, payload]
      );
    }
    console.log(`${n} events generated.`);
  } catch (err) {
    console.error('Error generating events:', err);
  } finally {
    client.release();
    pool.end();
  }
}

generateEvents(3000);
