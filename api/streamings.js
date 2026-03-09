const { createClient } = require('@supabase/supabase-js');

// Inicializa o Supabase com variáveis de ambiente que você configurará no Vercel
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

module.exports = async (req, res) => {
  // Configurações de CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*'); 
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // ROTA GET: Buscar dados
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('streamings')
        .select('*')
        .order('nome', { ascending: true });
      if (error) throw error;
      return res.status(200).json(data);
    }

    // ROTA POST: Adicionar dados
    if (req.method === 'POST') {
      const { nome, url, logo_url } = req.body;
      const { error } = await supabase
        .from('streamings')
        .insert([{ nome, url, logo_url }]);
      if (error) throw error;
      return res.status(200).json({ success: true });
    }

    // ROTA DELETE: Remover dados
    if (req.method === 'DELETE') {
      const nomeParaRemover = req.query.nome;
      const { error } = await supabase
        .from('streamings')
        .delete()
        .eq('nome', nomeParaRemover);
      if (error) throw error;
      return res.status(200).json({ success: true });
    }

    // Se o método não for suportado
    return res.status(405).json({ error: "Método não permitido" });

  } catch (err) {
    // Retorna erro como JSON para não quebrar o fetch no front-end
    return res.status(500).json({ error: err.message || "Erro interno do servidor" });
  }
};
