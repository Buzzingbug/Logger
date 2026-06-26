'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Container, Center, Stack, Title, Text, Button, Box } from '@mantine/core';
import { LoginButton } from './LoginButton';

export function LandingUI({ isLoggedIn }: { isLoggedIn: boolean }) {
  return (
    <Box 
      style={{
        position: 'relative',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        backgroundColor: '#09090b',
      }}
    >
      {/* Fluid Reactive Background using pure CSS */}
      <Box 
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      >
        <div 
          style={{
            position: 'absolute',
            top: '-20%',
            left: '-10%',
            width: '60vw',
            height: '60vw',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, rgba(0, 0, 0, 0) 70%)',
            filter: 'blur(80px)',
            mixBlendMode: 'screen',
            animation: 'float 10s ease-in-out infinite alternate',
          }}
        />
        <div 
          style={{
            position: 'absolute',
            bottom: '-20%',
            right: '-10%',
            width: '50vw',
            height: '50vw',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, rgba(0, 0, 0, 0) 70%)',
            filter: 'blur(80px)',
            mixBlendMode: 'screen',
            animation: 'float 12s ease-in-out infinite alternate-reverse',
          }}
        />
      </Box>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes float {
          0% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-50px) scale(1.1); }
          100% { transform: translateY(0) scale(1); }
        }
      `}} />

      <Container size="sm" style={{ zIndex: 1, position: 'relative' }}>
        <Stack align="center" gap="xl" ta="center">
          
          <Center 
            style={{ 
              width: 120, 
              height: 120, 
              borderRadius: '50%', 
              background: 'rgba(255, 255, 255, 0.05)', 
              border: '1px solid rgba(139, 92, 246, 0.3)',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 20px 40px rgba(139, 92, 246, 0.2)',
              overflow: 'hidden'
            }}
          >
            <Image 
              src="/logo.jpg" 
              alt="Logger Logo" 
              width={120} 
              height={120} 
              style={{ objectFit: 'cover' }}
            />
          </Center>

          <Title 
            order={1} 
            style={{ 
              fontSize: 'clamp(3rem, 8vw, 6rem)', 
              fontWeight: 900,
              letterSpacing: '-0.02em',
              background: 'linear-gradient(135deg, #ffffff 0%, #a1a1aa 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              lineHeight: 1.2,
              paddingBottom: '0.1em'
            }}
          >
            Logger.
          </Title>

          <Text size="xl" c="dimmed" maw={600} mx="auto" style={{ lineHeight: 1.6 }}>
            The ultimate logging architecture. Secure, encrypted, and visually stunning. Admin access strictly enforced.
          </Text>

          <Box mt="xl">
            {isLoggedIn ? (
              <Button
                component={Link}
                href="/dashboard"
                size="xl"
                radius="xl"
                variant="gradient"
                gradient={{ from: 'violet', to: 'indigo', deg: 45 }}
                style={{
                  boxShadow: '0 0 40px rgba(139, 92, 246, 0.4)',
                }}
              >
                Enter Dashboard &rarr;
              </Button>
            ) : (
              <LoginButton />
            )}
          </Box>
        </Stack>
      </Container>
    </Box>
  );
}
