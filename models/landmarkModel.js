const pool = require('../database/pool');

// Create or update user landmark
const upsertLandmark = async (user_id, latitude, longitude, address, label) => {
  await pool.query(
    `
    INSERT INTO delivery_landmarks (user_id, latitude, longitude, address, label)
    VALUES (?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      latitude = VALUES(latitude),
      longitude = VALUES(longitude),
      address = VALUES(address),
      label = VALUES(label)
    `,
    [user_id, latitude, longitude, address, label]
  );
};

// Get the user landmark
const getLandmarkByUser = async (user_id) => {
  const [rows] = await pool.query(
    `SELECT * FROM delivery_landmarks WHERE user_id = ? LIMIT 1`,
    [user_id]
  );
  return rows[0] ?? null;
};

module.exports = {
  upsertLandmark,
  getLandmarkByUser,
};
