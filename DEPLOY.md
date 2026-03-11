# Deploy (VPS + Domínio)

Este guia coloca o portal no ar com:
- Node.js (app)
- PM2 (process manager)
- Nginx (reverse proxy + gzip + cache + HTTPS)
- MySQL/MariaDB (banco)

## 1) DNS do domínio

No provedor do domínio `portaljuventudeperimirim.com.br`, crie:
- **A** `@` → IP público do seu VPS
- **A** `www` → IP público do seu VPS

Depois aguarde a propagação (pode levar de minutos até algumas horas).

## 2) Preparar o VPS (Ubuntu)

Instale pacotes básicos:

```bash
sudo apt update
sudo apt -y upgrade
sudo apt -y install nginx ufw curl
```

Firewall:

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable
sudo ufw status
```

## 3) Instalar Node.js LTS e PM2

Recomendado: Node 20+.

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt -y install nodejs
sudo npm i -g pm2
node -v
pm2 -v
```

## 4) Banco de dados (MySQL)

```bash
sudo apt -y install mysql-server
sudo systemctl enable mysql
sudo systemctl start mysql
sudo mysql_secure_installation
```

Crie banco e usuário:

```bash
sudo mysql -u root -p
```

```sql
CREATE DATABASE secretaria_juventude CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'juventude'@'localhost' IDENTIFIED BY 'senhasecretaria';
GRANT ALL PRIVILEGES ON secretaria_juventude.* TO 'juventude'@'localhost';
FLUSH PRIVILEGES;
```

## 5) Subir o projeto

Crie pasta e envie o projeto (git/zip/sftp). Exemplo:

```bash
sudo mkdir -p /var/www/secretariaDaJuventude
sudo chown -R $USER:$USER /var/www/secretariaDaJuventude
```

Dentro da pasta do projeto:

```bash
cd /var/www/secretariaDaJuventude
npm install
```

Crie um `.env` (sem commitar), com:

- `PORT=3000`
- `DB_HOST=127.0.0.1`
- `DB_PORT=3306`
- `DB_USER=juventude`
- `DB_PASSWORD=SENHA_FORTE_AQUI`
- `DB_NAME=secretaria_juventude`
- `DB_POOL_SIZE=10`

E-mail (Gmail com senha de app):

- `EMAIL_ENABLED=1`
- `SMTP_HOST=smtp.gmail.com`
- `SMTP_PORT=587`
- `SMTP_SECURE=0`
- `SMTP_USER=secretariajuventudeperi@gmail.com`
- `SMTP_PASS=SENHA_DE_APP_AQUI`
- `SMTP_FROM_NAME=Secretaria Municipal da Juventude de Peri Mirim`
- `SMTP_FROM_EMAIL=secretariajuventudeperi@gmail.com`
- `SMTP_REPLY_TO=secretariajuventudeperi@gmail.com`

Banco automático:
- `DB_AUTO_INIT=1` (use só no primeiro start; depois pode voltar para `0`)

## 6) Rodar com PM2

```bash
cd /var/www/secretariaDaJuventude
pm2 start app.js --name portal-juventude
pm2 save
pm2 startup
```

## 7) Nginx (reverse proxy)

Crie o arquivo:

```bash
sudo nano /etc/nginx/sites-available/portaljuventudeperimirim.com.br
```

Conteúdo:


  
  
  
  
```nginx
server {
  listen 80;
  server_name portaljuventudeperimirim.com.br www.portaljuventudeperimirim.com.br;

  gzip on;
  gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss image/svg+xml;

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

Ative e reinicie:

```bash
sudo ln -s /etc/nginx/sites-available/portaljuventudeperimirim.com.br /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 8) HTTPS (Let’s Encrypt)

```bash
sudo apt -y install certbot python3-certbot-nginx
sudo certbot --nginx -d portaljuventudeperimirim.com.br -d www.portaljuventudeperimirim.com.br
```

Teste de renovação:

```bash
sudo certbot renew --dry-run
```

## 9) Checklist pós-deploy

- Acessar `https://portaljuventudeperimirim.com.br`
- Fazer uma inscrição de teste (gincana/corrida)
- Confirmar se salvou no banco
- Confirmar se chegou e-mail de confirmação
- Conferir logs:

```bash
pm2 logs portal-juventude
```
