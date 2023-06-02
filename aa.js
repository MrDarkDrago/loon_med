const formidable = require('formidable');

app.post('/store_data', (req, res) => {
  const form = new formidable.IncomingForm();

  form.parse(req, (err, fields, files) => {
    if (err) {
      console.error('Error parsing form:', err);
      return res.sendStatus(500);
    }

    const { name, email } = fields;
    const { image } = files;

    // Assuming the column name in the database is 'image'
    const sql = `INSERT INTO users (name, email, image) VALUES (?, ?, ?)`;
    const values = [name, email, image.path]; // Assuming you store the file path in the database

    connection.query(sql, values, (err) => {
      if (err) {
        console.error('Error storing data:', err);
        return res.sendStatus(500);
      }

      return res.sendStatus(200);
    });
  });
});
