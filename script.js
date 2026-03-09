let modoRemocao = false;

async function buscarCanais() {
  const container = document.getElementById('links-container');
  const favoritos = JSON.parse(localStorage.getItem('favoritos')) || [];

  // Mapa de cores para cada plataforma
  const coresDestaque = {
    "netflix": "#e50914",
    "youtube": "#ff0000",
    "primevideo": "#00a8e1",
    "disney": "#113ccf",
    "hbo": "#5c2d91",
    "crunchyroll": "#f47521",
    "starplus": "#1f80e0"
  };

  try {
    const response = await fetch('/api/streamings');
    const data = await response.json();

    if (data.error) throw new Error(data.error);

    container.innerHTML = '';
    data.forEach((item, index) => {
      const isFav = favoritos.includes(item.nome);
      const card = document.createElement('div');
      card.className = `card ${isFav ? 'favoritado' : ''}`;

      // Adiciona o atraso na animação para criar o efeito cascata
      card.style.animationDelay = `${index * 0.1}s`;

      // Define a cor baseada no nome ou usa um vermelho padrão
      const nomeLimpo = item.nome.toLowerCase().replace(/\s+/g, '');
      const cor = coresDestaque[nomeLimpo] || "#e50914";
      card.style.setProperty('--cor-hover', cor);

      // Se modoRemocao estiver ativo, aplicamos um estilo de destaque
      if (modoRemocao) card.style.border = "2px solid #e50914";

      card.innerHTML = `
        <div class="fav-icon ${isFav ? 'active' : ''}" onclick="event.stopPropagation(); toggleFavorito('${item.nome}')">★</div>
        <img src="${item.logo_url}" onerror="this.src='https://via.placeholder.com/150'" alt="${item.nome}">
        <p><strong>${item.nome}</strong></p>
      `;

      card.onclick = () => {
        if (modoRemocao) {
          if (confirm(`Remover ${item.nome} da lista?`)) {
            executarRemocao(item.nome);
          }
        } else {
          // --- CORREÇÃO: Bloqueia cliques adicionais e dispara animação ---
          card.style.pointerEvents = 'none';
          card.classList.add('card-exit');

          // Aguarda 500ms antes de redirecionar
          setTimeout(() => {
            window.open(item.url, '_blank');
            // Reseta o estado para garantir que não haja travamentos
            card.style.pointerEvents = 'auto';
            card.classList.remove('card-exit');
          }, 500);
        }
      };
      container.appendChild(card);
    });
  } catch (err) {
    container.innerHTML = `<p style="color:red">Erro: ${err.message}</p>`;
  }
}

window.onload = buscarCanais;

async function adicionarStreaming() {
  const nome = prompt("Digite o nome da plataforma (ex: Netflix, Youtube):");
  if (!nome) return;

  const nomeFormatado = nome.toLowerCase().replace(/\s+/g, '');
  const url = `https://www.${nomeFormatado}.com`;

  const logosFixos = {
    "primevideo": "https://upload.wikimedia.org/wikipedia/commons/1/11/Amazon_Prime_Video_logo.svg",
    "disney": "https://upload.wikimedia.org/wikipedia/commons/3/3e/Disney%2B_logo.svg",
    "hbo": "https://upload.wikimedia.org/wikipedia/commons/1/17/HBO_logo.svg"
  };

  const logo_url = logosFixos[nomeFormatado] || `https://logo.clearbit.com/${nomeFormatado}.com`;

  try {
    const response = await fetch('/api/streamings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, url, logo_url })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Erro desconhecido no servidor");
    }
    buscarCanais(); 
  } catch (err) {
    console.error("Erro ao adicionar:", err);
    alert("Erro ao adicionar streaming: " + err.message);
  }
}

function removerStreaming() {
  modoRemocao = !modoRemocao;
  alert(modoRemocao ? "Modo Remoção ATIVADO: Clique em uma plataforma para removê-la." : "Modo Remoção DESATIVADO.");
  buscarCanais();
}

async function executarRemocao(nome) {
  try {
    const response = await fetch(`/api/streamings?nome=${encodeURIComponent(nome)}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Erro ao remover do servidor");
    }

    // --- CORREÇÃO DO CARD FANTASMA ---
    modoRemocao = false;
    const container = document.getElementById('links-container');
    container.innerHTML = '<p>Atualizando...</p>'; 

    setTimeout(() => {
      buscarCanais();
    }, 300);

  } catch (err) {
    console.error("Erro ao remover:", err);
    alert("Erro ao remover streaming: " + err.message);
  }
}

// --- FUNÇÃO DE PESQUISA ---
function filtrarCanais() {
  const input = document.getElementById('searchBar');
  const filtro = input.value.toLowerCase();
  const cards = document.querySelectorAll('.card');
  const termosFavoritos = ['favorito', 'favoritos', 'favoritado', 'favoritados'];

  cards.forEach(card => {
    const nome = card.querySelector('p').textContent.toLowerCase();
    const ehFavorito = card.classList.contains('favoritado');

    // Verifica se o texto digitado (mesmo incompleto) inicia um dos termos de favoritos
    const digitandoFavorito = termosFavoritos.some(termo => termo.startsWith(filtro) && filtro.length > 0);

    if (digitandoFavorito) {
      card.style.display = ehFavorito ? "" : "none";
    } else {
      card.style.display = nome.includes(filtro) ? "" : "none";
    }
  });
}

// --- FUNÇÃO DE FAVORITOS ---
function toggleFavorito(nome) {
  let favoritos = JSON.parse(localStorage.getItem('favoritos')) || [];
  if (favoritos.includes(nome)) {
    favoritos = favoritos.filter(f => f !== nome);
  } else {
    favoritos.push(nome);
  }
  localStorage.setItem('favoritos', JSON.stringify(favoritos));
  buscarCanais();
}