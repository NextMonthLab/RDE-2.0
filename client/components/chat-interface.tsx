import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MessageSquare, Trash2, Send, FileText, Bug, TestTube } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { apiRequest } from "@/lib/queryClient";
import type { ChatMessage } from "@shared/schema";

interface ChatInterfaceProps {
  currentFile?: string | null;
}

export default function ChatInterface({ currentFile }: ChatInterfaceProps) {
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const queryClient = useQueryClient();

  // Fetch chat messages
  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["/api/chat/messages"],
    refetchInterval: 2000, // Refresh every 2 seconds for real-time updates
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: { content: string; role: "user"; currentFile?: string }) => {
      setIsTyping(true);
      return await apiRequest("POST", "/api/chat/message", messageData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat/messages"] });
      setMessage("");
      setIsTyping(false);
    },
    onError: () => {
      setIsTyping(false);
    },
  });

  // Clear chat mutation
  const clearChatMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("DELETE", "/api/chat/messages");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat/messages"] });
    },
  });

  const handleSendMessage = () => {
    if (!message.trim() || sendMessageMutation.isPending) return;

    sendMessageMutation.mutate({
      content: message,
      role: "user",
      currentFile: currentFile || undefined,
    });
  };

  const handleQuickAction = (action: string) => {
    let quickMessage = "";
    
    switch (action) {
      case "generate":
        quickMessage = "Generate a new React component";
        break;
      case "fix":
        quickMessage = currentFile 
          ? `Please review the code in ${currentFile} and suggest improvements or fix any bugs`
          : "Help me fix bugs in my code";
        break;
      case "test":
        quickMessage = currentFile
          ? `Generate unit tests for the code in ${currentFile}`
          : "Help me write unit tests";
        break;
    }
    
    setMessage(quickMessage);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTimestamp = (timestamp: string | Date) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    
    if (diffMinutes < 1) {
      return "Just now";
    } else if (diffMinutes < 60) {
      return `${diffMinutes} min ago`;
    } else {
      const diffHours = Math.floor(diffMinutes / 60);
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    }
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="w-full h-full rde-bg-secondary border-l rde-border flex flex-col">
      {/* Chat Header */}
      <div className="px-4 py-3 border-b rde-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-medium rde-text-primary">AI Assistant</h3>
              <div className="flex items-center space-x-1 text-xs rde-text-secondary">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Claude Online</span>
              </div>
            </div>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 hover:rde-bg-accent"
            onClick={() => clearChatMutation.mutate()}
            title="Clear Chat"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Chat Messages */}
      <ScrollArea className="flex-1 px-4 py-4">
        <div className="space-y-4">
          {isLoading && (
            <div className="text-sm rde-text-secondary">Loading messages...</div>
          )}
          
          {Array.isArray(messages) && messages.length === 0 && !isLoading && (
            <div className="flex space-x-3">
              <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                <MessageSquare className="w-3 h-3 text-white" />
              </div>
              <div className="flex-1">
                <div className="rde-bg-accent rounded-lg px-3 py-2 text-sm rde-text-primary">
                  Welcome to RDE v2.0! I'm your AI assistant. I can help you:
                  <ul className="mt-2 space-y-1 text-xs rde-text-secondary">
                    <li>• Generate and modify code</li>
                    <li>• Create new components</li>
                    <li>• Debug issues</li>
                    <li>• Refactor existing code</li>
                  </ul>
                  How can I assist you today?
                </div>
                <div className="text-xs rde-text-secondary mt-1">Just now</div>
              </div>
            </div>
          )}
          
          {Array.isArray(messages) && messages.map((msg: ChatMessage) => (
            <div key={msg.id} className={`flex space-x-3 ${msg.role === "user" ? "justify-end" : ""}`}>
              {msg.role === "assistant" && (
                <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <MessageSquare className="w-3 h-3 text-white" />
                </div>
              )}
              
              <div className={`flex-1 ${msg.role === "user" ? "max-w-xs" : ""}`}>
                <div className={`rounded-lg px-3 py-2 text-sm ${
                  msg.role === "user" 
                    ? "bg-blue-600 text-white ml-auto" 
                    : "rde-bg-accent rde-text-primary"
                }`}>
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                </div>
                <div className={`text-xs rde-text-secondary mt-1 ${
                  msg.role === "user" ? "text-right" : ""
                }`}>
                  {msg.timestamp ? formatTimestamp(msg.timestamp) : 'Just now'}
                </div>
              </div>
              
              {msg.role === "user" && (
                <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <MessageSquare className="w-3 h-3 text-white" />
                </div>
              )}
            </div>
          ))}
          
          {isTyping && (
            <div className="flex space-x-3">
              <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                <MessageSquare className="w-3 h-3 text-white" />
              </div>
              <div className="flex-1">
                <div className="rde-bg-accent rounded-lg px-3 py-2 text-sm rde-text-primary">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Chat Input */}
      <div className="border-t rde-border p-4">
        <div className="space-y-3">
          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="secondary"
              className="text-xs rde-bg-accent hover:rde-bg-primary rde-text-primary"
              onClick={() => handleQuickAction("generate")}
            >
              <FileText className="w-3 h-3 mr-1" />
              Generate Component
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="text-xs rde-bg-accent hover:rde-bg-primary rde-text-primary"
              onClick={() => handleQuickAction("fix")}
            >
              <Bug className="w-3 h-3 mr-1" />
              Fix Bug
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="text-xs rde-bg-accent hover:rde-bg-primary rde-text-primary"
              onClick={() => handleQuickAction("test")}
            >
              <TestTube className="w-3 h-3 mr-1" />
              Add Tests
            </Button>
          </div>
          
          {/* Message Input */}
          <div className="relative">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me to generate code, fix bugs, or explain concepts..."
              className="rde-bg-primary rde-border rde-text-primary placeholder:rde-text-secondary resize-none pr-12"
              rows={3}
              disabled={sendMessageMutation.isPending}
            />
            <div className="absolute bottom-2 right-2 flex items-center space-x-2">
              <div className="text-xs rde-text-secondary">↵ Send</div>
              <Button
                size="sm"
                className="h-6 w-6 p-0 bg-blue-600 hover:bg-blue-700"
                onClick={handleSendMessage}
                disabled={!message.trim() || sendMessageMutation.isPending}
              >
                <Send className="w-3 h-3 text-white" />
              </Button>
            </div>
          </div>
          
          {currentFile && (
            <div className="text-xs rde-text-secondary">
              Current context: {currentFile.split("/").pop()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
