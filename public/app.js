let todosImoveis = [];

const grid = document.getElementById("propertyGrid");
const emptyState = document.getElementById("emptyState");

async function carregarImoveis() {
  try {

    const resposta = await fetch("/api/imoveis");

    todosImoveis = await resposta.json();

    renderizarImoveis(todosImoveis);

  } catch (erro) {

    console.error("Erro ao carregar imóveis:", erro);

  }
}


function renderizarImoveis(imoveis) {

  grid.innerHTML = "";

  if (!imoveis.length) {

    emptyState.style.display = "block";

    return;

  }

  emptyState.style.display = "none";


  imoveis.forEach(imovel => {

    const card = document.createElement("article");

    card.className = "property-card";


    const foto =
      imovel.fotos &&
      imovel.fotos.length
        ? imovel.fotos[0]
        : "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1000&q=80";


    const statusClass =
      imovel.status === "Vendido"
        ? "vendido"
        : imovel.status === "Alugado"
        ? "alugado"
        : "";


    card.innerHTML = `

      <div class="property-image">

        <img
          src="${foto}"
          alt="${escapar(imovel.titulo)}"
          loading="lazy"
        >

        <span class="property-status ${statusClass}">
          ${escapar(imovel.status || "Disponível")}
        </span>

      </div>


      <div class="property-content">

        <span class="property-type">
          ${escapar(imovel.finalidade || "Imóvel")}
        </span>


        <h3 class="property-title">
          ${escapar(imovel.titulo)}
        </h3>


        <p class="property-location">
          ${escapar(
            [imovel.bairro, imovel.cidade]
              .filter(Boolean)
              .join(" • ")
            || "Localização não informada"
          )}
        </p>


        <div class="property-info">

          ${
            imovel.area
              ? `<span>▧ ${escapar(imovel.area)} m²</span>`
              : ""
          }

          ${
            imovel.quartos
              ? `<span>♧ ${escapar(imovel.quartos)} quartos</span>`
              : ""
          }

          ${
            imovel.banheiros
              ? `<span>♢ ${escapar(imovel.banheiros)} banheiros</span>`
              : ""
          }

          ${
            imovel.vagas
              ? `<span>▣ ${escapar(imovel.vagas)} vagas</span>`
              : ""
          }

        </div>


        ${
          imovel.preco
            ? `
              <div class="property-price">
                ${escapar(imovel.preco)}
              </div>
            `
            : ""
        }


        <a
          class="property-link"
          href="https://wa.me/5583999999999?text=${encodeURIComponent(
            `Olá! Tenho interesse no imóvel "${imovel.titulo}".`
          )}"
          target="_blank"
        >
          Tenho interesse →
        </a>

      </div>

    `;


    grid.appendChild(card);

  });

}


function escapar(texto) {

  if (texto === null || texto === undefined) {
    return "";
  }

  return String(texto)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


// FILTROS

document
  .getElementById("buscarButton")
  .addEventListener("click", aplicarFiltros);


document
  .getElementById("filtroLocalizacao")
  .addEventListener("keyup", event => {

    if (event.key === "Enter") {
      aplicarFiltros();
    }

  });


function aplicarFiltros() {

  const finalidade =
    document.getElementById("filtroFinalidade").value;

  const tipo =
    document.getElementById("filtroTipo").value;

  const localizacao =
    document
      .getElementById("filtroLocalizacao")
      .value
      .toLowerCase()
      .trim();


  const filtrados = todosImoveis.filter(imovel => {

    const combinaFinalidade =
      !finalidade ||
      imovel.finalidade === finalidade;


    const combinaTipo =
      !tipo ||
      imovel.tipo === tipo;


    const textoLocal =
      `
        ${imovel.cidade || ""}
        ${imovel.bairro || ""}
        ${imovel.endereco || ""}
      `.toLowerCase();


    const combinaLocal =
      !localizacao ||
      textoLocal.includes(localizacao);


    return (
      combinaFinalidade &&
      combinaTipo &&
      combinaLocal
    );

  });


  renderizarImoveis(filtrados);

}


// MENU MOBILE

const menuButton =
  document.getElementById("menuButton");

menuButton.addEventListener("click", () => {

  const nav =
    document.querySelector(".main-nav");

  const aberto =
    nav.style.display === "flex";

  nav.style.display =
    aberto ? "none" : "flex";

  if (!aberto) {

    nav.style.position = "absolute";
    nav.style.top = "72px";
    nav.style.left = "0";
    nav.style.right = "0";
    nav.style.background = "#fff";
    nav.style.padding = "20px";
    nav.style.flexDirection = "column";
    nav.style.alignItems = "flex-start";
    nav.style.boxShadow =
      "0 10px 30px rgba(0,0,0,.08)";

  }

});


carregarImoveis();