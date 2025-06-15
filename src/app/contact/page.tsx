"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail, MapPin, Send, ArrowLeft, Github, Linkedin } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

export default function ContactPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")

  // You can customize these details for your team members
  const teamSocialLinks = [
    {
      name: "Shrish",
      github: "https://github.com/shrishshh",
      linkedin: "https://linkedin.com/in/shrishshh",
    },
    {
      name: "Aryaman", // Replace with your teammate's name
      github: "https://github.com/kachrooaryaman", // Replace with your teammate's GitHub URL
      linkedin: "https://linkedin.com/in/kachrooaryaman", // Replace with your teammate's LinkedIn URL
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, subject, message }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Message sent successfully! We'll get back to you soon.");
        setName("");
        setEmail("");
        setSubject("");
        setMessage("");
      } else {
        toast.error(data.error || "Failed to send message. Please try again.");
      }
    } catch (error) {
      toast.error("An unexpected error occurred. Please try again.");
    }
    setIsLoading(false);
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <Card className="shadow-2xl border-0 bg-background/80 dark:bg-background/60 backdrop-blur-lg ring-1 ring-primary/10 mb-8 md:mb-0">
            <CardHeader>
              <CardTitle className="text-2xl font-extrabold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Get in Touch
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Have questions about AI news or want to collaborate? We'd love to hear from you.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-start space-x-4">
                <Mail className="w-5 h-5 text-purple-600 mt-1" />
                <div>
                  <h3 className="font-medium">Email</h3>
                  <p className="text-muted-foreground">sidemindlabs@gmail.com</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <MapPin className="w-5 h-5 text-purple-600 mt-1" />
                <div>
                  <h3 className="font-medium">Location</h3>
                  <p className="text-muted-foreground">NewDelhi, IN | Charlotte, US</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div>
                  <h3 className="font-medium">Links</h3>
                  <div className="flex gap-4 mt-2">
                    {teamSocialLinks.map((member) => (
                      <div key={member.name} className="flex items-center gap-2">
                        <a href={member.github} target="_blank" rel="noopener noreferrer" className="hover:text-primary">
                          <Github className="w-5 h-5" />
                        </a>
                        <a href={member.linkedin} target="_blank" rel="noopener noreferrer" className="hover:text-primary">
                          <Linkedin className="w-5 h-5" />
                        </a>
                        <span className="text-sm">{member.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        <div>
          <Card className="shadow-2xl border-0 bg-background/80 dark:bg-background/60 backdrop-blur-lg ring-1 ring-primary/10">
            <CardHeader>
              <CardTitle className="text-2xl font-extrabold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Send a Message
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Fill out the form below and we'll get back to you as soon as possible.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="name" className="text-sm font-medium">
                      Name
                    </label>
                    <Input
                      id="name"
                      placeholder="Your name"
                      className="bg-input border-border"
                      required
                      value={name}
                      onChange={e => setName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium">
                      Email
                    </label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Your email"
                      className="bg-input border-border"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label htmlFor="subject" className="text-sm font-medium">
                    Subject
                  </label>
                  <Input
                    id="subject"
                    placeholder="What's this about?"
                    className="bg-input border-border"
                    required
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="message" className="text-sm font-medium">
                    Message
                  </label>
                  <Textarea
                    id="message"
                    placeholder="Your message..."
                    className="min-h-[120px] bg-input border-border"
                    required
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium shadow-lg"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    "Sending..."
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Send Message
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 