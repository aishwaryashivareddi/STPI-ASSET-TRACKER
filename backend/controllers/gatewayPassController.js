import { GatewayPass, Asset, Branch, User } from '../models/index.js';
import { Op } from 'sequelize';
import { generateGatewayPassId } from '../utils/idGenerator.js';
import { getFilePaths, deleteFile } from '../middleware/fileUpload.js';
import catchAsync from '../utils/catchAsync.js';
import ApiResponse from '../utils/ApiResponse.js';
import AppError from '../utils/AppError.js';
import PDFDocument from 'pdfkit';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GP_INCLUDES = [
  { model: Asset, as: 'asset' },
  { model: Branch, as: 'fromBranch' },
  { model: Branch, as: 'toBranch' },
  { model: User, as: 'creator', attributes: ['id', 'username'] }
];

// Create gateway pass - auto completes and transfers asset
export const createGatewayPass = catchAsync(async (req, res) => {
  const { asset_id, to_branch_id, reason, transfer_date, pass_through_person, prepared_by_person, authorized_by_person, received_by_person } = req.body;

  const asset = await Asset.findByPk(asset_id);
  if (!asset) throw new AppError('Asset not found', 404);

  if (asset.branch_id === parseInt(to_branch_id)) {
    throw new AppError('Source and destination branch cannot be the same', 400);
  }

  const gateway_pass_id = await generateGatewayPassId(asset.branch_id);

  const gp = await GatewayPass.create({
    gateway_pass_id,
    asset_id,
    from_branch_id: asset.branch_id,
    to_branch_id,
    reason,
    transfer_date,
    pass_through_person,
    prepared_by_person,
    authorized_by_person,
    received_by_person,
    created_by: req.user.id,
    status: 'Completed'
  });

  // Transfer asset to destination branch immediately
  await asset.update({ branch_id: to_branch_id });

  const result = await GatewayPass.findByPk(gp.id, { include: GP_INCLUDES });
  ApiResponse.created(res, result, 'Gateway pass created and asset transferred');
});

// Get all gateway passes
export const getAllGatewayPasses = catchAsync(async (req, res) => {
  const { search, sortBy = 'createdAt', sortOrder = 'DESC', page = 1, limit = 20 } = req.query;

  const where = {};
  if (search) {
    where[Op.or] = [
      { gateway_pass_id: { [Op.like]: `%${search}%` } },
      { reason: { [Op.like]: `%${search}%` } }
    ];
  }

  const offset = (page - 1) * limit;
  const validSortFields = ['gateway_pass_id', 'transfer_date', 'createdAt'];
  const orderField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
  const orderDirection = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

  const { count, rows } = await GatewayPass.findAndCountAll({
    where,
    include: GP_INCLUDES,
    limit: parseInt(limit),
    offset,
    order: [[orderField, orderDirection]]
  });

  ApiResponse.success(res, {
    gatewayPasses: rows,
    pagination: { total: count, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(count / limit) }
  });
});

// Download gateway pass as PDF
export const downloadGatewayPassPDF = catchAsync(async (req, res) => {
  const gp = await GatewayPass.findByPk(req.params.id, { include: GP_INCLUDES });
  if (!gp) throw new AppError('Gateway pass not found', 404);

  const doc = new PDFDocument({ size: 'A4', margin: 50 });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=GatePass_${gp.gateway_pass_id}.pdf`);
  doc.pipe(res);

  // Logo - left aligned
  const logoPath = path.join(__dirname, '..', '..', 'public', 'stpi-logo.png');
  try { doc.image(logoPath, 50, 40, { width: 100, fit: [100, 70] }); } catch (e) {}

  // Header text - starts after logo (x=160), centered in remaining space
  doc.font('Helvetica-Bold').fontSize(13)
    .text('Software Technology Parks of India', 160, 42, { width: 335, align: 'center' });
  doc.font('Helvetica').fontSize(8)
    .text('(An Autonomous Society under Ministry of Electronics and Information Technology, Govt. of India)', 160, 62, { width: 335, align: 'center' });
  doc.fontSize(9)
    .text('6Q3, 6th Floor, Cyber Towers, HITEC City, Madhapur, Hyderabad-500 081.', 160, 78, { width: 335, align: 'center' });

  // Gate Pass title - full width centered
  doc.font('Helvetica-Bold').fontSize(15)
    .text('GATE PASS', 50, 125, { width: 495, align: 'center' });

  // Meta info
  const y1 = 155;
  doc.font('Helvetica').fontSize(10);
  doc.text(`Sl.No.: ${gp.gateway_pass_id}`, 50, y1);
  doc.text(`Date: ${new Date(gp.transfer_date).toLocaleDateString('en-IN')}`, 400, y1);

  // Content
  let y = 165;
  doc.font('Helvetica').fontSize(11);
  doc.text(`1. Please pass out the following items through: `, 50, y, { continued: true })
    .font('Helvetica-Bold').text(gp.pass_through_person || '—');

  y += 25;
  doc.font('Helvetica').text(`2. Name/Organisation: `, 50, y, { continued: true })
    .font('Helvetica-Bold').text(`${gp.fromBranch?.name || ''} -> ${gp.toBranch?.name || ''}`);

  y += 25;
  doc.font('Helvetica').text('3. These items will be returned / ', 50, y, { continued: true })
    .font('Helvetica-Bold').text('will not be returned*');

  // Table
  y += 35;
  const tableTop = y;
  const colWidths = [40, 180, 40, 120, 115];
  const headers = ['S.No.', 'Name of the Item', 'Qty.', 'Expected Date of Return', 'Purpose'];
  const tableLeft = 50;

  // Table header
  doc.font('Helvetica-Bold').fontSize(9);
  let xPos = tableLeft;
  headers.forEach((h, i) => {
    doc.rect(xPos, tableTop, colWidths[i], 25).stroke();
    doc.text(h, xPos + 4, tableTop + 7, { width: colWidths[i] - 8, align: 'center' });
    xPos += colWidths[i];
  });

  // Table row
  const rowTop = tableTop + 25;
  const rowData = ['1', `${gp.asset?.name || ''} (${gp.asset?.asset_id || ''})`, '1', 'N/A', gp.reason || ''];
  doc.font('Helvetica').fontSize(9);
  xPos = tableLeft;
  rowData.forEach((d, i) => {
    doc.rect(xPos, rowTop, colWidths[i], 30).stroke();
    doc.text(d, xPos + 4, rowTop + 8, { width: colWidths[i] - 8, align: 'center' });
    xPos += colWidths[i];
  });

  // Signatures
  y = rowTop + 60;
  doc.font('Helvetica-Bold').fontSize(11);
  doc.text('4. Prepared by:', 50, y);
  doc.font('Helvetica').text(gp.prepared_by_person || gp.creator?.username || '', 50, y + 16);

  doc.font('Helvetica-Bold').text('5. Authorised by:', 230, y);
  doc.font('Helvetica').text(gp.authorized_by_person || '', 230, y + 16);

  doc.font('Helvetica-Bold').text('6. Received by:', 410, y);
  doc.font('Helvetica').text(gp.received_by_person || '', 410, y + 16);

  // Footer note
  y += 50;
  doc.font('Helvetica').fontSize(9)
    .text('*Strike out which is not applicable', 50, y);

  doc.end();
});

// Get single gateway pass
export const getGatewayPassById = catchAsync(async (req, res) => {
  const gp = await GatewayPass.findByPk(req.params.id, { include: GP_INCLUDES });
  if (!gp) throw new AppError('Gateway pass not found', 404);
  ApiResponse.success(res, gp);
});

// Update gateway pass
export const updateGatewayPass = catchAsync(async (req, res) => {
  const gp = await GatewayPass.findByPk(req.params.id);
  if (!gp) throw new AppError('Gateway pass not found', 404);
  await gp.update(req.body);
  const result = await GatewayPass.findByPk(gp.id, { include: GP_INCLUDES });
  ApiResponse.success(res, result, 'Gateway pass updated');
});

// Upload signed copy
export const uploadSignedCopy = catchAsync(async (req, res) => {
  const gp = await GatewayPass.findByPk(req.params.id);
  if (!gp) throw new AppError('Gateway pass not found', 404);

  if (!req.files?.signed_copy) throw new AppError('No file uploaded', 400);

  // Delete old file if exists
  if (gp.signed_copy) deleteFile(gp.signed_copy);

  await gp.update({ signed_copy: req.files.signed_copy[0].path });
  ApiResponse.success(res, gp, 'Signed copy uploaded successfully');
});

// Delete signed copy
export const deleteSignedCopy = catchAsync(async (req, res) => {
  const gp = await GatewayPass.findByPk(req.params.id);
  if (!gp) throw new AppError('Gateway pass not found', 404);
  if (!gp.signed_copy) throw new AppError('No signed copy to delete', 404);

  deleteFile(gp.signed_copy);
  await gp.update({ signed_copy: null });
  ApiResponse.success(res, null, 'Signed copy deleted');
});

// Download signed copy
export const downloadSignedCopy = catchAsync(async (req, res) => {
  const gp = await GatewayPass.findByPk(req.params.id);
  if (!gp) throw new AppError('Gateway pass not found', 404);
  if (!gp.signed_copy) throw new AppError('No signed copy found', 404);

  const fileName = gp.signed_copy.split(/[\\/]/).pop();
  res.download(gp.signed_copy, fileName);
});

// Delete gateway pass (Admin only)
export const deleteGatewayPass = catchAsync(async (req, res) => {
  const gp = await GatewayPass.findByPk(req.params.id);
  if (!gp) throw new AppError('Gateway pass not found', 404);

  await gp.destroy();
  ApiResponse.success(res, null, 'Gateway pass deleted');
});
