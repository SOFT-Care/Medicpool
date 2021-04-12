CREATE TABLE registration (
  id SERIAL PRIMARY KEY,
  first_name VARCHAR(30),
  last_name VARCHAR(30),
  gender VARCHAR(10),
  email_address VARCHAR(50),
  password VARCHAR(20)
  );