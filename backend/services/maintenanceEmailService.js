import nodemailer from 'nodemailer';
import logger from '../config/logger.js';

// Department email mapping based on asset type
const DEPARTMENT_EMAILS = {
  'COMPUTER': process.env.DEPT_EMAIL_IT || 'it@stpi.in',
  'HSDC': process.env.DEPT_EMAIL_IT || 'it@stpi.in',
  'ELECTRICAL': process.env.DEPT_EMAIL_ELECTRICAL || 'electrical@stpi.in',
  'OFFICE': process.env.DEPT_EMAIL_ADMIN || 'admin@stpi.in',
  'FURNITURE': process.env.DEPT_EMAIL_ADMIN || 'admin@stpi.in',
  'FIREFIGHTING': process.env.DEPT_EMAIL_SAFETY || 'safety@stpi.in',
  'BUILDING': process.env.DEPT_EMAIL_CIVIL || 'civil@stpi.in'
};

const getTransporter = () => {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) return null;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || 587),
    secure: false,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
  });
};

export const sendMaintenanceNotification = async (asset, maintenance, requestedBy) => {
  const deptEmail = DEPARTMENT_EMAILS[asset.asset_type] || 'admin@stpi.in';
  const scheduledDate = new Date(maintenance.scheduled_date).toLocaleDateString('en-IN');

  const subject = `Maintenance Scheduled for Asset ${asset.asset_id}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 24px; border-radius: 10px 10px 0 0;">
        <h2 style="margin:0;">Maintenance Notification</h2>
      </div>
      <div style="background: #f9f9f9; padding: 24px; border-radius: 0 0 10px 10px;">
        <p>Dear Team,</p>
        <p>A maintenance activity has been scheduled for the following asset:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr><td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #e2e8f0;">Asset ID</td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${asset.asset_id}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #e2e8f0;">Asset Name</td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${asset.name}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #e2e8f0;">Maintenance Type</td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${maintenance.maintenance_type}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #e2e8f0;">Scheduled Date</td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${scheduledDate}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold;">Requested By</td><td style="padding: 8px;">${requestedBy}</td></tr>
        </table>
        <p>Please take the necessary action.</p>
        <p>Regards,<br><strong>STPI Asset Tracker</strong></p>
      </div>
    </div>
  `;

  const transporter = getTransporter();
  if (transporter) {
    try {
      await transporter.sendMail({
        from: process.env.SMTP_FROM || 'noreply@stpi.in',
        to: deptEmail,
        subject,
        html
      });
      logger.info(`Maintenance notification sent to ${deptEmail} for asset ${asset.asset_id}`);
    } catch (err) {
      logger.error(`Failed to send maintenance email: ${err.message}`);
    }
  } else {
    logger.info(`[DEV] Maintenance notification (no SMTP configured):\n  To: ${deptEmail}\n  Subject: ${subject}\n  Asset: ${asset.asset_id} - ${asset.name}\n  Type: ${maintenance.maintenance_type}\n  Date: ${scheduledDate}\n  Requested By: ${requestedBy}`);
  }
};
