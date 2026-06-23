import React, { useState } from "react";
import { GiftedChat } from "react-native-gifted-chat";

const BotChat = () => {
    const [messages, setMessages] = useState([
        {
            _id: 1,
            text: "Hello! I am your medical chatbot. How can I assist you with your chest pain?",
            createdAt: new Date(),
            user: { _id: 2, name: "Chatbot" },
        },
    ]);

    const handleSend = (newMessages = []) => {
        setMessages((previousMessages) =>
            GiftedChat.append(previousMessages, newMessages)
        );

        const userMessage = newMessages[0].text;
        const botResponse = generateChatbotResponse(userMessage);

        setMessages((previousMessages) =>
            GiftedChat.append(previousMessages, [
                {
                    _id: Math.round(Math.random() * 1000000),
                    text: botResponse,
                    createdAt: new Date(),
                    user: { _id: 2, name: "Chatbot" },
                },
            ])
        );
    };

    const generateChatbotResponse = (userMessage) => {
        userMessage = userMessage.toLowerCase();

        if (userMessage.includes("acute chest pain")) {
            return "Are you experiencing acute chest pain? (yes/no)";
        } else if (userMessage.includes("yes") && userMessage.includes("acute chest pain")) {
            return "Please provide your history and physical examination details.";
        } else if (userMessage.includes("history") || userMessage.includes("physical examination")) {
            return "Have you done an ECG? (yes/no)";
        } else if (userMessage.includes("ecg")) {
            return "Does the ECG indicate a potential cardiac cause? (yes/no)";
        } else if (userMessage.includes("potential cardiac cause")) {
            return "Is it a STEMI? (yes/no)";
        } else if (userMessage.includes("stemi")) {
            return "Follow the STEMI guidelines.";
        } else if (userMessage.includes("no") && userMessage.includes("stemi")) {
            return "Evaluate based on suspected etiology using patient-centric algorithms.";
        } else if (userMessage.includes("non-cardiac cause")) {
            return "Evaluate for non-cardiac causes.";
        } else if (userMessage.includes("acute coronary syndrome")) {
            return "Please follow the guidelines for Acute Coronary Syndrome (excluding STEMI).";
        } else if (userMessage.includes("pulmonary embolism")) {
            return "Please follow the guidelines for Pulmonary Embolism.";
        } else if (userMessage.includes("valvular heart disease")) {
            return "Please follow the guidelines for Valvular Heart Disease.";
        } else if (userMessage.includes("acute aortic syndrome")) {
            return "Please follow the guidelines for Acute Aortic Syndrome.";
        } else if (userMessage.includes("acute myocarditis")) {
            return "Please follow the guidelines for Acute Myocarditis.";
        }

        return "I'm sorry, I didn't understand that. Can you please provide more details or rephrase?";
    };

    return (
        <GiftedChat
            messages={messages}
            onSend={(newMessages) => handleSend(newMessages)}
            user={{ _id: 1, name: "User" }}
        />
    );
};

export default BotChat;
