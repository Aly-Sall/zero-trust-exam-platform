using Microsoft.AspNetCore.SignalR;

namespace SecureExam.API.Hubs
{
    // Ce Hub est le canal de communication temps réel
    public class MonitoringHub : Hub
    {
        // On laisse la classe vide pour le moment. 
        // L'API va l'utiliser pour "crier" (broadcast) des messages aux clients connectés.
    }
}