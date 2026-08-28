// Service worker só do painel de admin — recebe o aviso push de um ticket
// de suporte precisando de decisão e mostra a notificação do sistema.

self.addEventListener("push", (event) => {
  if (!event.data) return;
  let dados;
  try {
    dados = event.data.json();
  } catch {
    return;
  }

  event.waitUntil(
    self.registration.showNotification(dados.title || "Meu Barbeiro", {
      body: dados.body || "",
      icon: "/icon?ae40422bbcf2c038",
      data: { url: dados.url || "/admin/relatorios" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/admin/relatorios";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    }),
  );
});
