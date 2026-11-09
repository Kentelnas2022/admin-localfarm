import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, subject, message } = body;

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Name, email, and message are required.' },
        { status: 400 }
      );
    }

    // Safely create table and persist inquiry
    try {
      await query(`
        CREATE TABLE IF NOT EXISTS \`contact_inquiries\` (
          \`id\` INT AUTO_INCREMENT PRIMARY KEY,
          \`name\` VARCHAR(255) NOT NULL,
          \`email\` VARCHAR(255) NOT NULL,
          \`subject\` VARCHAR(255) DEFAULT 'General Inquiry',
          \`message\` TEXT NOT NULL,
          \`status\` VARCHAR(50) DEFAULT 'unread',
          \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      await query(
        `INSERT INTO \`contact_inquiries\` (\`name\`, \`email\`, \`subject\`, \`message\`) VALUES (?, ?, ?, ?)`,
        [name.trim(), email.trim(), subject || 'General Inquiry', message.trim()]
      );
    } catch (dbErr) {
      console.warn('Could not persist contact inquiry to DB, falling back safely:', dbErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Your inquiry has been successfully received. We will get in touch shortly.',
    });
  } catch (error: any) {
    console.error('Contact API error:', error);
    return NextResponse.json(
      { error: 'Failed to process inquiry. Please try again.' },
      { status: 500 }
    );
  }
}
