import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import bcrypt from 'bcryptjs';
import { pool, query } from './lib/db.js';

async function main() {
  await pool.query(readFileSync(resolve(process.cwd(), 'src/schema.sql'), 'utf8'));
  console.log('Schema criado/validado.');
  if (process.env.SEED_DEMO !== 'true' || process.env.NODE_ENV === 'production') return;
  const orgId = '10000000-0000-4000-8000-000000000001';
  await query('INSERT INTO organizations(id,name) VALUES($1,$2) ON CONFLICT(id) DO NOTHING', [orgId, 'Clínica Aurora']);
  const password = await bcrypt.hash('Demo@12345', 12);
  await query(`INSERT INTO users(organization_id,name,email,password_hash,role)
    VALUES($1,'Alex Martins','demo@clinicflow.local',$2,'admin') ON CONFLICT(email) DO NOTHING`, [orgId, password]);
  const people = [
    ['Mariana Oliveira','5561991110001','mariana@email.com',['Avaliação','Novo']],
    ['Lucas Ferreira','5561991110002','lucas@email.com',['Retorno']],
    ['Beatriz Costa','5561991110003','beatriz@email.com',['VIP']],
    ['Gabriel Rocha','5561991110004','gabriel@email.com',['Nutrição']],
    ['Camila Almeida','5561991110005','camila@email.com',['Novo']],
    ['Rafael Mendes','5561991110006','rafael@email.com',['Fisioterapia']],
    ['Juliana Ribeiro','5561991110007','juliana@email.com',['VIP']],
    ['Pedro Santos','5561991110008','pedro@email.com',['Avaliação']]
  ] as const;
  const ids: string[] = [];
  for (const [name, phone, email, tags] of people) {
    const row = await query<{id:string}>(`INSERT INTO contacts(organization_id,name,phone,email,tags,opted_in)
      VALUES ($1,$2,$3,$4,$5,TRUE) ON CONFLICT(organization_id,phone) DO UPDATE SET name=EXCLUDED.name RETURNING id`, [orgId,name,phone,email,[...tags]]);
    ids.push(row.rows[0].id);
  }
  const opportunities: Array<[number,string,number,string]> = [
    [0,'Plano de acompanhamento',185000,'qualified'],
    [1,'Avaliação inicial',25000,'new'],
    [2,'Pacote de sessões',240000,'proposal'],
    [3,'Consulta especializada',45000,'won'],
    [4,'Plano trimestral',120000,'new'],
    [5,'Fisioterapia esportiva',99000,'qualified'],
    [6,'Renovação semestral',320000,'proposal'],
    [7,'Consulta de retorno',20000,'won']
  ];
  for (const [i,title,value,stage] of opportunities) {
    await query(`INSERT INTO deals (organization_id,contact_id,title,value_cents,stage)
      SELECT $1,$2,$3,$4,$5 WHERE NOT EXISTS (SELECT 1 FROM deals WHERE organization_id=$1 AND contact_id=$2 AND title=$3)`, [orgId,ids[i],title,value,stage]);
  }
  const texts: Array<[number,string,string,number]> = [
    [0,'Olá! Gostaria de saber quais horários vocês têm disponíveis.', 'inbound', 2],
    [0,'Olá Mariana! Claro, temos horários na quinta e sexta. 😊', 'outbound', 1],
    [1,'Bom dia! Vocês atendem por convênio?', 'inbound', 3],
    [2,'Obrigada pelo atendimento de ontem!', 'inbound', 5],
    [2,'Foi um prazer receber você, Beatriz!', 'outbound', 4],
    [3,'Quero agendar uma consulta para semana que vem.', 'inbound', 8],
    [4,'Como funciona a primeira avaliação?', 'inbound', 15],
    [5,'Boa tarde! Consegui os exames solicitados.', 'inbound', 25]
  ];
  const shouldSeed = new Map<number, boolean>();
  for (const [i,body,direction,hours] of texts) {
    if (!shouldSeed.has(i)) {
      const count = await query('SELECT id FROM messages WHERE organization_id=$1 AND contact_id=$2 LIMIT 1', [orgId,ids[i]]);
      shouldSeed.set(i, !count.rowCount);
    }
    // Preserve existing histories; seed all example messages for each new contact.
    if (!shouldSeed.get(i)) continue;
    await query(`INSERT INTO messages(organization_id,contact_id,direction,body,status,is_read,created_at)
      VALUES($1,$2,$3,$4,$5,$6,now()-($7::int * interval '1 hour'))`, [orgId,ids[i],direction,body,direction==='inbound'?'received':'simulated',direction==='outbound',hours]);
  }
  console.log('Dados fictícios inseridos. Login: demo@clinicflow.local / Demo@12345');
}
main().catch(err => { console.error(err); process.exitCode = 1; }).finally(async () => { await pool.end(); });
