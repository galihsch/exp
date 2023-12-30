const express = require('express');
const cors = require('cors');
const axios = require('axios');
const fs = require('fs');
const { promisify } = require('util');
const path = require('path');

const app = express();
const port = 3000; // Ganti dengan port yang Anda inginkan

app.use(cors());

const writeFileAsync = promisify(fs.writeFile);

app.get('/proxy', async (req, res) => {
  try {
    // Dapatkan URL target dan nama file dari query parameter
    const targetUrl = req.query.url;
    const fileName = path.basename(targetUrl);

    // Lakukan permintaan ke URL target menggunakan axios
    const response = await axios.get(targetUrl, { responseType: 'stream' });

    // Tentukan path tempat menyimpan file
    const filePath = path.join(__dirname, 'downloaded_files', fileName);

    // Buat direktori jika belum ada
    fs.mkdirSync(path.dirname(filePath), { recursive: true });

    // Simpan file yang didownload ke path yang ditentukan
    const fileStream = fs.createWriteStream(filePath);

    response.data.pipe(fileStream);

    fileStream.on('finish', () => {
      // Kirim file sebagai respons
      res.download(filePath, fileName, (err) => {
        // Hapus file setelah dikirim
        fs.unlink(filePath, (unlinkErr) => {
          if (unlinkErr) {
            console.error('Error deleting downloaded file:', unlinkErr);
          }
        });

        if (err) {
          console.error('Error sending file:', err);
        }
      });
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server proxy.' });
  }
});

app.listen(port, () => {
  console.log(`Server berjalan di http://localhost:${port}`);
});
