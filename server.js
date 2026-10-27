const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const app = express();

const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

const ROOT = __dirname;
const PUBLIC_DIR = path.join(ROOT, "public");
const UPLOADS_DIR = path.join(ROOT, "uploads");
const DATA_DIR = path.join(ROOT, "data");
const DATA_FILE = path.join(DATA_DIR, "imoveis.json");

const LOGO_FILE = path.join(
  ROOT,
  "simbolo.corretoradeimoveis.leticiaraquel.png"
);

// Criar pastas automaticamente
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, "[]", "utf8");
}

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Arquivos públicos
app.use(express.static(PUBLIC_DIR));

// Fotos dos imóveis
app.use("/uploads", express.static(UPLOADS_DIR));

// Logo
app.get("/logo", (req, res) => {
  if (fs.existsSync(LOGO_FILE)) {
    return res.sendFile(LOGO_FILE);
  }

  res.status(404).send("Logo não encontrada.");
});

// ----------------------------------------------------
// BANCO DE DADOS EM JSON
// ----------------------------------------------------

function lerImoveis() {
  try {
    const dados = fs.readFileSync(DATA_FILE, "utf8");
    return JSON.parse(dados);
  } catch (error) {
    return [];
  }
}

function salvarImoveis(imoveis) {
  fs.writeFileSync(
    DATA_FILE,
    JSON.stringify(imoveis, null, 2),
    "utf8"
  );
}

// ----------------------------------------------------
// LOGIN ADMIN
// ----------------------------------------------------

app.post("/api/login", (req, res) => {
  const { password } = req.body;

  if (password === ADMIN_PASSWORD) {
    return res.json({
      sucesso: true
    });
  }

  res.status(401).json({
    sucesso: false,
    mensagem: "Senha incorreta."
  });
});

// ----------------------------------------------------
// IMÓVEIS
// ----------------------------------------------------

app.get("/api/imoveis", (req, res) => {
  const imoveis = lerImoveis();

  const ordenados = imoveis.sort(
    (a, b) => new Date(b.criadoEm) - new Date(a.criadoEm)
  );

  res.json(ordenados);
});

app.get("/api/imoveis/:id", (req, res) => {
  const imoveis = lerImoveis();

  const imovel = imoveis.find(
    item => item.id === req.params.id
  );

  if (!imovel) {
    return res.status(404).json({
      mensagem: "Imóvel não encontrado."
    });
  }

  res.json(imovel);
});

// ----------------------------------------------------
// UPLOAD DE FOTOS
// ----------------------------------------------------

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOADS_DIR);
  },

  filename: function (req, file, cb) {
    const extensao = path.extname(file.originalname);

    const nomeSeguro =
      Date.now() +
      "-" +
      Math.random().toString(36).substring(2, 10) +
      extensao;

    cb(null, nomeSeguro);
  }
});

const upload = multer({
  storage: storage,

  limits: {
    fileSize: 10 * 1024 * 1024
  },

  fileFilter: function (req, file, cb) {
    const permitidos = [
      "image/jpeg",
      "image/png",
      "image/webp"
    ];

    if (permitidos.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Formato de imagem não permitido. Use JPG, PNG ou WEBP."
        )
      );
    }
  }
});

// ----------------------------------------------------
// CRIAR IMÓVEL
// ----------------------------------------------------

app.post(
  "/api/imoveis",
  upload.array("fotos", 20),
  (req, res) => {
    try {
      const imoveis = lerImoveis();

      const dados = req.body;

      const novoImovel = {
        id:
          Date.now().toString() +
          Math.random().toString(36).substring(2, 8),

        titulo: dados.titulo || "Imóvel sem título",

        tipo: dados.tipo || "Imóvel",

        finalidade: dados.finalidade || "Venda",

        preco: dados.preco || "",

        condominio: dados.condominio || "",

        iptu: dados.iptu || "",

        quartos: dados.quartos || "",

        banheiros: dados.banheiros || "",

        vagas: dados.vagas || "",

        area: dados.area || "",

        cidade: dados.cidade || "",

        bairro: dados.bairro || "",

        endereco: dados.endereco || "",

        descricao: dados.descricao || "",

        destaque:
          dados.destaque === "true" ||
          dados.destaque === "on",

        status: dados.status || "Disponível",

        fotos: (req.files || []).map(
          file => `/uploads/${file.filename}`
        ),

        criadoEm: new Date().toISOString()
      };

      imoveis.push(novoImovel);

      salvarImoveis(imoveis);

      res.json({
        sucesso: true,
        imovel: novoImovel
      });

    } catch (error) {
      console.error(error);

      res.status(500).json({
        sucesso: false,
        mensagem: "Erro ao cadastrar imóvel."
      });
    }
  }
);

// ----------------------------------------------------
// EDITAR IMÓVEL
// ----------------------------------------------------

app.put(
  "/api/imoveis/:id",
  upload.array("fotos", 20),
  (req, res) => {
    try {
      const imoveis = lerImoveis();

      const indice = imoveis.findIndex(
        item => item.id === req.params.id
      );

      if (indice === -1) {
        return res.status(404).json({
          mensagem: "Imóvel não encontrado."
        });
      }

      const atual = imoveis[indice];
      const dados = req.body;

      const novasFotos = (req.files || []).map(
        file => `/uploads/${file.filename}`
      );

      let fotos = atual.fotos || [];

      if (dados.manterFotos === "false") {
        fotos = [];
      }

      fotos = [...fotos, ...novasFotos];

      imoveis[indice] = {
        ...atual,

        titulo: dados.titulo ?? atual.titulo,

        tipo: dados.tipo ?? atual.tipo,

        finalidade:
          dados.finalidade ?? atual.finalidade,

        preco: dados.preco ?? atual.preco,

        condominio:
          dados.condominio ?? atual.condominio,

        iptu: dados.iptu ?? atual.iptu,

        quartos:
          dados.quartos ?? atual.quartos,

        banheiros:
          dados.banheiros ?? atual.banheiros,

        vagas:
          dados.vagas ?? atual.vagas,

        area:
          dados.area ?? atual.area,

        cidade:
          dados.cidade ?? atual.cidade,

        bairro:
          dados.bairro ?? atual.bairro,

        endereco:
          dados.endereco ?? atual.endereco,

        descricao:
          dados.descricao ?? atual.descricao,

        destaque:
          dados.destaque === "true" ||
          dados.destaque === "on",

        status:
          dados.status ?? atual.status,

        fotos
      };

      salvarImoveis(imoveis);

      res.json({
        sucesso: true,
        imovel: imoveis[indice]
      });

    } catch (error) {
      console.error(error);

      res.status(500).json({
        sucesso: false,
        mensagem: "Erro ao editar imóvel."
      });
    }
  }
);

// ----------------------------------------------------
// ALTERAR STATUS
// ----------------------------------------------------

app.patch("/api/imoveis/:id/status", (req, res) => {
  const imoveis = lerImoveis();

  const imovel = imoveis.find(
    item => item.id === req.params.id
  );

  if (!imovel) {
    return res.status(404).json({
      mensagem: "Imóvel não encontrado."
    });
  }

  const { status } = req.body;

  const statusPermitidos = [
    "Disponível",
    "Vendido",
    "Alugado"
  ];

  if (!statusPermitidos.includes(status)) {
    return res.status(400).json({
      mensagem: "Status inválido."
    });
  }

  imovel.status = status;

  salvarImoveis(imoveis);

  res.json({
    sucesso: true,
    imovel
  });
});

// ----------------------------------------------------
// EXCLUIR IMÓVEL
// ----------------------------------------------------

app.delete("/api/imoveis/:id", (req, res) => {
  const imoveis = lerImoveis();

  const indice = imoveis.findIndex(
    item => item.id === req.params.id
  );

  if (indice === -1) {
    return res.status(404).json({
      mensagem: "Imóvel não encontrado."
    });
  }

  const removido = imoveis[indice];

  // Apagar fotos do imóvel
  if (removido.fotos) {
    removido.fotos.forEach(foto => {
      const nomeArquivo = path.basename(foto);
      const caminho = path.join(
        UPLOADS_DIR,
        nomeArquivo
      );

      if (fs.existsSync(caminho)) {
        try {
          fs.unlinkSync(caminho);
        } catch (error) {
          console.log(
            "Não foi possível apagar:",
            caminho
          );
        }
      }
    });
  }

  imoveis.splice(indice, 1);

  salvarImoveis(imoveis);

  res.json({
    sucesso: true
  });
});

// ----------------------------------------------------
// REMOVER UMA FOTO
// ----------------------------------------------------

app.delete(
  "/api/imoveis/:id/foto",
  (req, res) => {
    const imoveis = lerImoveis();

    const imovel = imoveis.find(
      item => item.id === req.params.id
    );

    if (!imovel) {
      return res.status(404).json({
        mensagem: "Imóvel não encontrado."
      });
    }

    const { foto } = req.body;

    if (!foto) {
      return res.status(400).json({
        mensagem: "Foto não informada."
      });
    }

    imovel.fotos = (imovel.fotos || []).filter(
      item => item !== foto
    );

    const nomeArquivo = path.basename(foto);

    const caminho = path.join(
      UPLOADS_DIR,
      nomeArquivo
    );

    if (fs.existsSync(caminho)) {
      try {
        fs.unlinkSync(caminho);
      } catch (error) {
        console.log(error);
      }
    }

    salvarImoveis(imoveis);

    res.json({
      sucesso: true,
      imovel
    });
  }
);

// ----------------------------------------------------
// PÁGINAS
// ----------------------------------------------------

app.get("/admin", (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, "admin.html"));
});

app.use((req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, "index.html"));
});
// ----------------------------------------------------
// ERROS
// ----------------------------------------------------

app.use((error, req, res, next) => {
  console.error(error);

  res.status(500).json({
    sucesso: false,
    mensagem:
      error.message ||
      "Ocorreu um erro no servidor."
  });
});

// ----------------------------------------------------
// INICIAR SERVIDOR
// ----------------------------------------------------

app.listen(PORT, () => {
  console.log("");
  console.log("====================================");
  console.log("   CORRETORA LETÍCIA RAQUEL");
  console.log("====================================");
  console.log("");
  console.log(`Site:   http://localhost:${PORT}`);
  console.log(`Painel: http://localhost:${PORT}/admin`);
  console.log("");
});