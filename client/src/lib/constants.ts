export const MEMBERSHIP_TIERS = [
  { id: 'family', name: 'Family', price: 60 },
  { id: 'adult', name: 'Adult', price: 40 },
  { id: 'senior_couple', name: 'Senior Couple', price: 45 },
  { id: 'senior', name: 'Senior', price: 30 },
  { id: 'student', name: 'Student', price: 20 },
];

export const MEMBER_STATUSES = [
  { id: 'active', name: 'Active' },
  { id: 'expired', name: 'Expired' },
  { id: 'pending', name: 'Pending' },
  { id: 'archived', name: 'Archived' },
];

export const PAYMENT_METHODS = [
  { id: 'cash', name: 'Cash' },
  { id: 'credit_card', name: 'Credit Card' },
  { id: 'check', name: 'Check' },
  { id: 'online', name: 'Online' },
];

export const TRANSACTION_TYPES = [
  { id: 'new_membership', name: 'New Membership' },
  { id: 'renewal', name: 'Renewal' },
  { id: 'donation', name: 'Donation' },
];

export const CAMPAIGN_STATUSES = [
  { id: 'draft', name: 'Draft' },
  { id: 'scheduled', name: 'Scheduled' },
  { id: 'sent', name: 'Sent' },
  { id: 'cancelled', name: 'Cancelled' },
];

export const NEWSLETTER_MERGE_TAGS = [
  { id: 'first_name', name: 'First Name', tag: '{{first_name}}' },
  { id: 'last_name', name: 'Last Name', tag: '{{last_name}}' },
  { id: 'membership_level', name: 'Membership Level', tag: '{{membership_level}}' },
  { id: 'renewal_date', name: 'Renewal Date', tag: '{{renewal_date}}' },
];

export const NEWSLETTER_TEMPLATE = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Herschell Carrousel Factory Museum Newsletter</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
      background-color: #FBF7F0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }
    .header {
      background-color: #8B2131;
      color: #ffffff;
      padding: 20px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-family: 'Georgia', serif;
    }
    .content {
      padding: 20px;
    }
    .footer {
      background-color: #F3D6A1;
      color: #333;
      padding: 15px;
      text-align: center;
      font-size: 12px;
    }
    .button {
      display: inline-block;
      background-color: #8B2131;
      color: #ffffff;
      padding: 10px 20px;
      text-decoration: none;
      border-radius: 4px;
      margin-top: 10px;
    }
    img {
      max-width: 100%;
      height: auto;
    }
    .social-links {
      margin-top: 10px;
    }
    .social-links a {
      display: inline-block;
      margin: 0 5px;
      color: #333;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Herschell Carrousel Factory Museum</h1>
      <p>Where History Comes Full Circle</p>
    </div>
    <div class="content">
      <h2>Hello {{first_name}},</h2>
      
      <!-- NEWSLETTER CONTENT GOES HERE -->
      
      <p>Thank you for being a valued {{membership_level}} member!</p>
      
      <a href="https://www.carrouselmuseum.org/" class="button">Visit Our Website</a>
    </div>
    <div class="footer">
      <p>Herschell Carrousel Factory Museum<br>180 Thompson Street, North Tonawanda, NY 14120</p>
      <p>Your membership renewal date is {{renewal_date}}</p>
      <div class="social-links">
        <a href="#">Facebook</a> | <a href="#">Instagram</a> | <a href="#">Twitter</a>
      </div>
      <p>To unsubscribe or update preferences, <a href="#">click here</a></p>
    </div>
  </div>
</body>
</html>
`;
