/**
 * Validação ponta a ponta do Supabase (banco, RLS, trigger de apoios e Storage).
 *
 * Uso:
 *   npm run validate:supabase
 *
 * O script cria dois usuários anônimos, publica um relato de teste com foto,
 * apoia o relato com o segundo usuário, testa as regras de RLS e, ao final,
 * remove o relato, o apoio e a imagem. Não deixe dados de teste no banco.
 *
 * Requer que `supabase/schema.sql` já tenha sido executado e que o login
 * anônimo esteja habilitado no painel do Supabase.
 */
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';

import { createClient } from '@supabase/supabase-js';

function loadEnvFile(file = '.env.local') {
  const text = readFileSync(file, 'utf8');

  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (!match) continue;

    const key = match[1];
    let value = match[2].trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvFile();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error(
    'Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY em .env.local.',
  );
  process.exit(1);
}

const clientOptions = {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
};

const clientA = createClient(url, key, clientOptions);
const clientB = createClient(url, key, clientOptions);

// PNG válido de 8x8 gerado localmente (laranja sólido).
const PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAWSURBVChTY3gVwfMfH2ZAF0DHw0MBAPQNk0FVeWAYAAAAAElFTkSuQmCC';

const reportId = randomUUID();
const results = [];
let userA = null;
let userB = null;
let reportPath = null;
let reportCreated = false;
let imageUploaded = false;

function pass(name, extra = '') {
  results.push({ name, pass: true, extra });
  console.log(`✓ ${name}${extra ? ` — ${extra}` : ''}`);
}

function fail(name, error) {
  const message = error?.message ?? String(error);
  results.push({ name, pass: false, extra: message });
  console.error(`✗ ${name} — ${message}`);
}

async function check(name, fn) {
  try {
    const extra = await fn();
    pass(name, extra ?? '');
    return extra;
  } catch (error) {
    fail(name, error);
    throw error;
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function expectError(result, code, label) {
  assert(result.error, `${label}: era esperado um erro, mas a operação passou.`);
  assert(
    result.error.code === code,
    `${label}: esperado código ${code}, recebido ${result.error.code} (${result.error.message}).`,
  );
}

async function cleanup() {
  if (!userA) return;

  try {
    if (userB) {
      await clientB
        .from('upvotes')
        .delete()
        .eq('report_id', reportId)
        .eq('user_id', userB.id);
    }
  } catch {
    // limpeza best-effort
  }

  try {
    if (reportCreated) {
      await clientA.from('reports').delete().eq('id', reportId);
    }
  } catch {
    // limpeza best-effort
  }

  try {
    if (imageUploaded && reportPath) {
      await clientA.storage.from('report-images').remove([reportPath]);
    }
  } catch {
    // limpeza best-effort
  }
}

async function main() {
  console.log(`Validando ${url}\n`);

  await check('login anônimo do usuário A', async () => {
    const { data, error } = await clientA.auth.signInAnonymously();
    if (error) throw error;
    userA = data.user;
    assert(userA?.id, 'Supabase não retornou o usuário anônimo A.');
    return userA.id;
  });

  await check('login anônimo do usuário B', async () => {
    const { data, error } = await clientB.auth.signInAnonymously();
    if (error) throw error;
    userB = data.user;
    assert(userB?.id, 'Supabase não retornou o usuário anônimo B.');
    assert(userB.id !== userA.id, 'Os dois logins retornaram o mesmo usuário.');
    return userB.id;
  });

  await check('tabela public.reports existe e é legível', async () => {
    const { error } = await clientA.from('reports').select('id').limit(1);
    if (error) throw error;
    return 'ok';
  });

  await check('tabela public.upvotes existe e é legível', async () => {
    const { error } = await clientA.from('upvotes').select('id').limit(1);
    if (error) throw error;
    return 'ok';
  });

  reportPath = `${userA.id}/${reportId}/foto-${Date.now()}.png`;

  await check('upload de foto no bucket report-images', async () => {
    const bytes = Buffer.from(PNG_BASE64, 'base64');
    const { error } = await clientA.storage
      .from('report-images')
      .upload(reportPath, bytes, {
        contentType: 'image/png',
        cacheControl: '3600',
        upsert: false,
      });
    if (error) throw error;
    imageUploaded = true;
    return `${bytes.length} bytes`;
  });

  await check('URL pública da foto responde 200', async () => {
    const { data } = clientA.storage
      .from('report-images')
      .getPublicUrl(reportPath);
    const response = await fetch(data.publicUrl);
    assert(response.ok, `URL pública retornou HTTP ${response.status}.`);
    return data.publicUrl;
  });

  await check('publicação de relato com foto', async () => {
    const { error } = await clientA.from('reports').insert({
      id: reportId,
      user_id: userA.id,
      title: `[QA] Validação automática ${new Date().toISOString()}`,
      description:
        'Relato temporário criado pelo script de validação. Será removido automaticamente.',
      category: 'iluminacao',
      neighborhood: 'Centro',
      image_path: reportPath,
    });
    if (error) throw error;
    reportCreated = true;
    return reportId;
  });

  await check('relato novo nasce com status aberto e 0 apoios', async () => {
    const { data, error } = await clientA
      .from('reports')
      .select('status, upvotes_count, image_path')
      .eq('id', reportId)
      .single();
    if (error) throw error;
    assert(data.status === 'aberto', `status=${data.status}`);
    assert(data.upvotes_count === 0, `upvotes_count=${data.upvotes_count}`);
    assert(data.image_path === reportPath, 'image_path não foi persistido.');
    return `status=${data.status}, apoios=${data.upvotes_count}`;
  });

  await check('usuário B apoia o relato e o contador vira 1', async () => {
    const { error } = await clientB.from('upvotes').insert({
      report_id: reportId,
      user_id: userB.id,
    });
    if (error) throw error;

    const { data, error: readError } = await clientA
      .from('reports')
      .select('upvotes_count')
      .eq('id', reportId)
      .single();
    if (readError) throw readError;
    assert(data.upvotes_count === 1, `upvotes_count=${data.upvotes_count}`);
    return 'trigger de contador ok';
  });

  await check('apoio duplicado é bloqueado (23505)', async () => {
    const result = await clientB.from('upvotes').insert({
      report_id: reportId,
      user_id: userB.id,
    });
    expectError(result, '23505', 'apoio duplicado');
    return 'unique constraint ok';
  });

  await check('autor não pode apoiar o próprio relato (42501)', async () => {
    const result = await clientA.from('upvotes').insert({
      report_id: reportId,
      user_id: userA.id,
    });
    expectError(result, '42501', 'autoapoio');
    return 'RLS ok';
  });

  await check('usuário B remove o apoio e o contador volta a 0', async () => {
    const { error } = await clientB
      .from('upvotes')
      .delete()
      .eq('report_id', reportId)
      .eq('user_id', userB.id);
    if (error) throw error;

    const { data, error: readError } = await clientA
      .from('reports')
      .select('upvotes_count')
      .eq('id', reportId)
      .single();
    if (readError) throw readError;
    assert(data.upvotes_count === 0, `upvotes_count=${data.upvotes_count}`);
    return 'trigger de remoção ok';
  });

  await check('autor remove o próprio relato', async () => {
    const { error } = await clientA
      .from('reports')
      .delete()
      .eq('id', reportId);
    if (error) throw error;
    reportCreated = false;

    const { data, error: readError } = await clientA
      .from('reports')
      .select('id')
      .eq('id', reportId);
    if (readError) throw readError;
    assert(data.length === 0, 'O relato ainda aparece após a exclusão.');
    return 'relato removido';
  });

  await check('autor remove a própria foto', async () => {
    const { error } = await clientA.storage
      .from('report-images')
      .remove([reportPath]);
    if (error) throw error;
    imageUploaded = false;

    const { data, error: listError } = await clientA.storage
      .from('report-images')
      .list(`${userA.id}/${reportId}`);
    if (listError) throw listError;
    assert(data.length === 0, 'A imagem ainda aparece no bucket.');
    return 'imagem removida';
  });
}

main()
  .catch((error) => {
    if (error?.code === 'PGRST205') {
      console.error(
        '\nA tabela public.reports não existe. Execute supabase/schema.sql no SQL Editor do Supabase.',
      );
    } else if (error?.code === 'NoSuchBucket') {
      console.error(
        '\nO bucket report-images não existe. Execute supabase/schema.sql no SQL Editor do Supabase.',
      );
    }
  })
  .finally(async () => {
    await cleanup();

    const passed = results.filter((result) => result.pass).length;
    console.log(`\nResumo: ${passed}/${results.length} verificações passaram.`);

    if (passed !== results.length) {
      process.exitCode = 1;
    }
  });
