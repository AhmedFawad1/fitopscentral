import { validatePhoneNumber } from '@/app/lib/data/countries';

/* ---------------- SQL BUILDERS ---------------- */

export function buildAudienceQuery(selectedAudience, gymid) {
  if (!selectedAudience.length) {
    return `select * from member_view_local where 1=0 and gym_id='${gymid}'`;
  }

  const conditions = [];

  selectedAudience.forEach((audience) => {
    switch (audience) {
      case 'Active':
      case 'Inactive':
      case 'Cancelled':
        conditions.push(`current_status='${audience}'`);
        break;

      case 'Due Today':
        conditions.push(`due_date=date('now')`);
        break;

      case 'Due Tomorrow':
        conditions.push(`due_date=date('now','+1 day')`);
        break;

      case 'Canc. Today':
        conditions.push(`cancellation_date=date('now')`);
        break;

      case 'Canc. Tomorrow':
        conditions.push(`cancellation_date=date('now','+1 day')`);
        break;
    }
  });

  return `
    select * from member_view_local
    where (${conditions.join(' OR ')})
    and gym_id='${gymid}'
  `;
}

export function buildCustomFilterQuery(filter, gymid) {
  const { type, range } = filter;

  switch (type) {
    case 'Birthdays':
      return `
        select * from member_view_local
        where strftime('%m-%d', date_of_birth)=strftime('%m-%d','now')
        and gym_id='${gymid}'
      `;

    case 'Balance Due':
      return `
        select * from member_view_local
        where balance>0
        and gym_id='${gymid}'
      `;
    case 'Active':
    case 'Inactive':
    case 'Cancelled':
      return `
        select * from member_view_local
        where current_status='${type}'
        and gym_id='${gymid}'
        ${
          range.start && range.end
            ? `and start_date between '${range.start}' and '${range.end}'`
            : ''
        }
      `
    default:
      if (!range) return '';
      return `
        select * from member_view_local
        where ${type.toLowerCase().replace(' ', '_')}
        between '${range.start}' and '${range.end}'
        and gym_id='${gymid}'
      `;
  }
}

export async function getTemplates(gym_id, branch_id) {
  const query = `
    select * from templates_local
    where gym_id='${gym_id}'
    and (branch_id='${branch_id}' or branch_id is null)
    and type='whatsapp'
    order by created_at desc
  `;
  return await invoke('run_sqlite_query', { query });
}
/* ---------------- MESSAGE HELPERS ---------------- */

export const replaceTags = (text, member) => {
  text = text
    .replace('{Name}', member.name || '')
    .replace('{contact}', member.contact || '')
    .replace('{Father Name}', member.father_name || '')
    .replace('{Receipt Date}', parseDate(member.receipt_date))
    .replace('{Start Date}', parseDate(member.start_date))
    .replace('{Due Date}', parseDate(member.due_date))
    .replace('{Cancellation Date}', parseDate(member.cancellation_date))
    .replace('{Trainer}', parseText(member.trainer_name))
    .replace('{Package}', parseText(member.package_name))
    .replace('{Balance}', member.balance || 0);

  return text
    .split('\n')
    .map((l) => l.trim())
    .join('\n');
};

export const parseDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export const parseText = (t = '') =>
  t ? t.replace(/\n/g, ' ').trim() : 'N/A';
