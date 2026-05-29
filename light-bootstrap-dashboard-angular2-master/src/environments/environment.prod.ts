// apiUrl = URL du backend telle que le navigateur y accède (même hôte que l’app si possible). Sinon API + WebSocket messagerie échouent.
export const environment = {
  production: true,
  apiUrl: 'http://192.168.1.50:8089',
  googleClientId: '' // optionnel si google.oauth.client-ids est défini côté backend
};

