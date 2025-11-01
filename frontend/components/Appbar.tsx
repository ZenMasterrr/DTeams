"use client";
import { useRouter } from "next/navigation";
import { PrimaryButton } from "./buttons/PrimaryButton";
import { useState, useEffect } from "react";

interface CustomWindow extends Window {
    ethereum?: any;
}

declare const window: CustomWindow;

export const Appbar = () => {
    const router = useRouter();
    const [userAddress, setUserAddress] = useState<string | null>(null);

    // Effect to check for an existing session and handle wallet events
    useEffect(() => {
        const checkSession = async () => {
            if (window.ethereum) {
                const token = localStorage.getItem("token");
                const accounts = await window.ethereum.request({ method: 'eth_accounts' });

                if (token && accounts.length > 0) {
                    setUserAddress(accounts[0]);
                } else {
                    // If there's no token or no connected accounts, ensure user is logged out
                    handleLogout(false); // Don't redirect, just clear state
                }
            }
        };

        checkSession();

        // --- Event Listeners for MetaMask ---
        const handleAccountsChanged = (accounts: string[]) => {
            if (accounts.length === 0) {
                // Wallet disconnected
                handleLogout();
            } else {
                // Switched to a new account, treat as a new login
                setUserAddress(accounts[0]);
                // You might want to force a re-authentication here by clearing the old token
                localStorage.removeItem("token");
                router.push('/signup'); // Redirect to signup to get a new token for the new address
            }
        };

        if (window.ethereum) {
            window.ethereum.on('accountsChanged', handleAccountsChanged);
        }

        // Cleanup listeners on component unmount
        return () => {
            if (window.ethereum) {
                window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
            }
        };
    }, [router]);

    const connectWallet = async () => {
        if (window.ethereum) {
            try {
                const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                setUserAddress(accounts[0]);
                // After connecting, redirect to signup to get a JWT token
                router.push('/signup');
            } catch (error) {
                console.error("Error connecting to MetaMask", error);
            }
        } else {
            alert("Please install MetaMask!");
        }
    };

    const handleLogout = (redirect = true) => {
        localStorage.removeItem("token");
        setUserAddress(null);
        if (redirect) {
            router.push("/signup");
        }
    };

    return (
        <div className="flex border-b justify-between p-4">
            <div className="flex flex-col justify-center text-2xl font-extrabold">
                Dteams
            </div>
            <div className="flex items-center">
                {userAddress ? (
                    <div className="flex items-center">
                        <span className="mr-4 text-sm">{`${userAddress.substring(0, 6)}...${userAddress.substring(userAddress.length - 4)}`}</span>
                        <PrimaryButton onClick={() => handleLogout()}>Logout</PrimaryButton>
                    </div>
                ) : (
                    <PrimaryButton onClick={connectWallet}>Connect Wallet</PrimaryButton>
                )}
            </div>
        </div>
    );
};