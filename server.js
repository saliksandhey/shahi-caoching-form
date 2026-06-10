const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const nodemailer = require('nodemailer');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Supabase Client
// We ensure we don't crash if env vars are missing during build/dev, but warn the user.
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize Nodemailer Transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'shahicoaching@gmail.com', // Using your gmail address
        pass: process.env.GMAIL_APP_PASSWORD // You will generate this securely
    }
});

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from the current directory
app.use(express.static(path.join(__dirname)));

// API Route for Form Submission
app.post('/api/register', async (req, res) => {
    try {
        const {
            fullName,
            fatherName,
            mobile,
            email,
            dob,
            city,
            shortAddress,
            skillLevel,
            notes
        } = req.body;

        // 1. Validate required fields
        if (!fullName || !fatherName || !mobile || !dob || !city || !shortAddress || !skillLevel) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // 2. Save to Supabase
        // Note: Replace 'registrations' with your actual table name if different.
        // Replace column names below if they differ from your schema.
        const { data, error: dbError } = await supabase
            .from('registrations')
            .insert([
                {
                    full_name: fullName,
                    father_name: fatherName,
                    mobile_number: mobile,
                    email_address: email || null,
                    date_of_birth: dob,
                    city: city,
                    short_address: shortAddress,
                    skill_level: skillLevel,
                    additional_notes: notes || null,
                    // Registration Date is usually handled by Supabase default 'created_at' column
                }
            ]);

        if (dbError) {
            console.error('Supabase Error:', dbError);
            return res.status(500).json({ error: 'Failed to save registration data.' });
        }

        // 3. Send Owner Notification Email
        const ownerEmailHtml = `
            <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #faf9fb; border-radius: 12px; overflow: hidden; border: 1px solid #e5e7eb;">
                <div style="background: #0f0c1b; padding: 30px 40px; text-align: center;">
                    <h2 style="color: #ffffff; margin: 0; font-family: 'Playfair Display', serif; font-size: 24px; font-weight: 500;">New Enrollment Received</h2>
                </div>
                <div style="padding: 40px; background: #ffffff;">
                    <p style="color: #6b7280; font-size: 16px; margin-bottom: 24px;">A new student has registered for Shahi Academy.</p>
                    
                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
                        <tr><td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6; color: #9ca3af; width: 40%;">Full Name</td><td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6; color: #111827; font-weight: 500;">${fullName}</td></tr>
                        <tr><td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6; color: #9ca3af;">Father's Name</td><td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6; color: #111827; font-weight: 500;">${fatherName}</td></tr>
                        <tr><td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6; color: #9ca3af;">Mobile Number</td><td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6; color: #111827; font-weight: 500;">${mobile}</td></tr>
                        <tr><td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6; color: #9ca3af;">Email</td><td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6; color: #111827; font-weight: 500;">${email || 'N/A'}</td></tr>
                        <tr><td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6; color: #9ca3af;">Date of Birth</td><td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6; color: #111827; font-weight: 500;">${dob}</td></tr>
                        <tr><td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6; color: #9ca3af;">City / Address</td><td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6; color: #111827; font-weight: 500;">${city}, ${shortAddress}</td></tr>
                        <tr><td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6; color: #9ca3af;">Skill Level</td><td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6; color: #111827; font-weight: 500;">${skillLevel}</td></tr>
                    </table>
                    
                    <div style="background: #f9fafb; padding: 20px; border-radius: 8px; border-left: 4px solid #8a4fff;">
                        <p style="margin: 0; color: #6b7280; font-size: 14px;"><strong>Additional Notes:</strong><br>${notes || 'None provided.'}</p>
                    </div>
                </div>
            </div>
        `;

        try {
            await transporter.sendMail({
                from: '"Shahi Academy System" <shahicoaching@gmail.com>',
                to: 'shahicoaching@gmail.com',
                subject: 'New Student Registration - Shahi Academy',
                html: ownerEmailHtml
            });
            console.log('Owner notification email sent successfully.');
        } catch (emailError) {
            console.error('Failed to send owner email:', emailError);
        }

        // 4. Send Student Welcome Email (if email exists)
        if (email) {
            const studentEmailHtml = `
                <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e5e7eb; box-shadow: 0 10px 25px rgba(0,0,0,0.05);">
                    <div style="background: #0f0c1b; padding: 40px; text-align: center;">
                        <h1 style="color: #ffffff; margin: 0; font-family: 'Playfair Display', serif; font-size: 28px; font-weight: 500;">Welcome to Shahi Academy</h1>
                    </div>
                    <div style="padding: 40px;">
                        <p style="color: #111827; font-size: 18px; margin-bottom: 16px;">Dear ${fullName},</p>
                        <p style="color: #6b7280; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">Thank you for taking the first step towards mastering the art of tailoring. We have successfully received your enrollment application.</p>
                        
                        <div style="background: #f9fafb; border-radius: 12px; padding: 24px; margin-bottom: 32px; text-align: center;">
                            <h3 style="color: #8a4fff; margin-top: 0; margin-bottom: 12px; font-weight: 600;">What Happens Next?</h3>
                            <p style="color: #6b7280; font-size: 15px; margin: 0; line-height: 1.5;">Our team is currently reviewing your profile. We will contact you shortly regarding class schedules, batch timings, and the beginning of your training.</p>
                        </div>
                        
                        <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">We look forward to guiding you on this professional journey.</p>
                        <br/>
                        <p style="color: #111827; font-size: 16px; margin: 0; font-weight: 600;">Warm Regards,</p>
                        <p style="color: #8a4fff; font-size: 16px; margin-top: 4px; font-family: 'Playfair Display', serif; font-weight: 600; font-style: italic;">Shahi Academy Institute</p>
                    </div>
                </div>
            `;

            try {
                await transporter.sendMail({
                    from: '"Shahi Academy" <shahicoaching@gmail.com>',
                    to: email,
                    subject: 'Welcome to Shahi Academy',
                    html: studentEmailHtml
                });
                console.log('Student welcome email sent successfully to', email);
            } catch (studentEmailError) {
                console.error('Failed to send student welcome email:', studentEmailError);
            }
        }

        // 5. Show success message
        res.status(200).json({ success: true, message: 'Registration completed successfully.' });

    } catch (err) {
        console.error('Server Error:', err);
        res.status(500).json({ error: 'An unexpected server error occurred.' });
    }
});

// Fallback to index.html for any other route
app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

if (!process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
}

// Export the Express API for Vercel serverless deployment
module.exports = app;
