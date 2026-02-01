const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');
const prisma = require('../lib/prisma');

const BACKUP_DIR = path.join(__dirname, '../../backups');

const ensureDir = () => {
  if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });
};

const pgDumpExists = () => {
  const which = process.platform === 'win32' ? 'where' : 'which';
  return new Promise((resolve) => {
    execFile(which, ['pg_dump'], (err) => resolve(!err));
  });
};

exports.getBackups = async (req, res) => {
  ensureDir();
  const files = fs
    .readdirSync(BACKUP_DIR)
    .filter((f) => f.endsWith('.sql') || f.endsWith('.dump') || f.endsWith('.json'))
    .map((f) => {
      const fp = path.join(BACKUP_DIR, f);
      const stat = fs.statSync(fp);
      return { id: f, filename: f, size: stat.size, createdAt: stat.mtime.toISOString() };
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  res.json({ success: true, data: files });
};

exports.createBackup = async (req, res) => {
  ensureDir();

  const canDump = await pgDumpExists();
  if (!canDump) {
    return res.status(500).json({
      success: false,
      message: 'pg_dump not found on server. Install PostgreSQL client tools to enable DB backups.',
    });
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return res.status(500).json({ success: false, message: 'DATABASE_URL missing in .env' });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `backup-${timestamp}.sql`;
  const filepath = path.join(BACKUP_DIR, filename);

  execFile('pg_dump', [databaseUrl, '--no-owner', '--no-privileges', '--format=p', '--file', filepath], (err, stdout, stderr) => {
    if (err) {
      console.error('pg_dump error:', stderr || err.message);
      return res.status(500).json({ success: false, message: 'Backup failed', error: stderr || err.message });
    }
    return res.status(201).json({ success: true, message: 'Backup created', data: { id: filename, filename } });
  });
};

exports.downloadBackup = async (req, res) => {
  ensureDir();
  const id = req.params.id;
  const filePath = path.join(BACKUP_DIR, id);

  if (!fs.existsSync(filePath)) return res.status(404).json({ success: false, message: 'Backup not found' });

  res.download(filePath);
};

exports.deleteBackup = async (req, res) => {
  ensureDir();
  const id = req.params.id;
  const filePath = path.join(BACKUP_DIR, id);

  if (!fs.existsSync(filePath)) return res.status(404).json({ success: false, message: 'Backup not found' });

  fs.unlinkSync(filePath);
  res.json({ success: true, message: 'Backup deleted' });
};

exports.restoreBackup = async (req, res) => {
  const allowed = String(process.env.ALLOW_DB_RESTORE || '').toLowerCase() === 'true';
  if (!allowed) {
    return res.status(403).json({
      success: false,
      message: 'DB restore is disabled. Set ALLOW_DB_RESTORE=true to enable (and protect this endpoint).',
    });
  }

  return res.status(501).json({ success: false, message: 'Restore not implemented in this build' });
};

exports.getBackupSettings = async (req, res) => {
  const rows = await prisma.systemConfig.findMany({
    where: { key: { in: ['backup_enabled', 'backup_cron', 'backup_retention_days'] } },
  });

  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  res.json({
    success: true,
    data: {
      backup_enabled: map.backup_enabled ?? 'false',
      backup_cron: map.backup_cron ?? '0 2 * * *',
      backup_retention_days: map.backup_retention_days ?? '30',
    },
  });
};

exports.updateBackupSettings = async (req, res) => {
  const { backup_enabled, backup_cron, backup_retention_days } = req.body || {};

  const updates = [];
  if (backup_enabled !== undefined) {
    updates.push(
      prisma.systemConfig.upsert({
        where: { key: 'backup_enabled' },
        update: { value: String(backup_enabled), type: 'boolean' },
        create: { key: 'backup_enabled', value: String(backup_enabled), type: 'boolean' },
      })
    );
  }
  if (backup_cron) {
    updates.push(
      prisma.systemConfig.upsert({
        where: { key: 'backup_cron' },
        update: { value: String(backup_cron), type: 'string' },
        create: { key: 'backup_cron', value: String(backup_cron), type: 'string' },
      })
    );
  }
  if (backup_retention_days !== undefined) {
    updates.push(
      prisma.systemConfig.upsert({
        where: { key: 'backup_retention_days' },
        update: { value: String(backup_retention_days), type: 'number' },
        create: { key: 'backup_retention_days', value: String(backup_retention_days), type: 'number' },
      })
    );
  }

  await Promise.all(updates);
  res.json({ success: true, message: 'Backup settings updated' });
};

exports.scheduleBackup = async (req, res) => {
  res.status(501).json({ success: false, message: 'Scheduling is not implemented. Use cron/PM2 in production.' });
};

exports.getBackupSchedule = async (req, res) => {
  res.status(501).json({ success: false, message: 'Scheduling is not implemented. Use cron/PM2 in production.' });
};

exports.cleanupBackups = async (req, res) => {
  ensureDir();
  const retentionDays = Number(process.env.BACKUP_RETENTION_DAYS || 30);
  const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000;

  const removed = [];
  for (const f of fs.readdirSync(BACKUP_DIR)) {
    const fp = path.join(BACKUP_DIR, f);
    const stat = fs.statSync(fp);
    if (stat.isFile() && stat.mtimeMs < cutoff) {
      fs.unlinkSync(fp);
      removed.push(f);
    }
  }

  res.json({ success: true, message: 'Cleanup complete', data: { removed } });
};

exports.verifyBackup = async (req, res) => {
  ensureDir();
  const id = req.params.id;
  const filePath = path.join(BACKUP_DIR, id);

  if (!fs.existsSync(filePath)) return res.status(404).json({ success: false, message: 'Backup not found' });

  const stat = fs.statSync(filePath);
  res.json({ success: true, data: { id, filename: id, size: stat.size, exists: true } });
};

exports.getBackupStats = async (req, res) => {
  ensureDir();
  const files = fs.readdirSync(BACKUP_DIR);
  const sizes = files.map((f) => fs.statSync(path.join(BACKUP_DIR, f)).size);
  const totalSize = sizes.reduce((a, b) => a + b, 0);

  res.json({
    success: true,
    data: {
      totalBackups: files.length,
      totalSizeBytes: totalSize,
      retentionDays: Number(process.env.BACKUP_RETENTION_DAYS || 30),
    },
  });
};

exports.exportData = async (req, res) => {
  res.status(501).json({ success: false, message: 'Export is not implemented yet' });
};

exports.importData = async (req, res) => {
  res.status(501).json({ success: false, message: 'Import is not implemented yet' });
};

exports.optimizeDatabase = async (req, res) => {
  res.status(501).json({ success: false, message: 'Optimize is not implemented yet' });
};

exports.repairDatabase = async (req, res) => {
  res.status(501).json({ success: false, message: 'Repair is not implemented yet' });
};
