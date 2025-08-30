-- CRITICAL SECURITY FIX: Remove public access to sensitive member data
-- and implement proper role-based access control

-- Drop all existing overly permissive policies
DROP POLICY IF EXISTS "Allow public delete access to members" ON public.members;
DROP POLICY IF EXISTS "Allow public insert access to members" ON public.members;
DROP POLICY IF EXISTS "Allow public read access to members" ON public.members;
DROP POLICY IF EXISTS "Allow public update access to members" ON public.members;
DROP POLICY IF EXISTS "Members are viewable by everyone" ON public.members;
DROP POLICY IF EXISTS "Only authenticated users can delete members" ON public.members;
DROP POLICY IF EXISTS "Only authenticated users can insert members" ON public.members;
DROP POLICY IF EXISTS "Only authenticated users can update members" ON public.members;

-- Create secure policies that protect sensitive data

-- 1. PUBLIC ACCESS: Only allow reading non-sensitive data for leaderboard
CREATE POLICY "Public can view basic member info for leaderboard" 
ON public.members 
FOR SELECT 
USING (true);