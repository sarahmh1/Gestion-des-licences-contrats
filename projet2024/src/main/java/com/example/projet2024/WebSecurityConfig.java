//package com.example.projet2024;
//import com.example.projet2024.Security.Jwt.AuthEntryPointJwt;
//import com.example.projet2024.Security.Jwt.AuthTokenFilter;
//import com.example.projet2024.Security.Services.UserDetailsServiceImpl;
//import org.springframework.beans.factory.annotation.Autowired;
//import org.springframework.context.annotation.Bean;
//import org.springframework.context.annotation.Configuration;
//import org.springframework.security.authentication.AuthenticationManager;
//import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
//import org.springframework.security.config.annotation.method.configuration.EnableGlobalMethodSecurity;
//import org.springframework.security.config.annotation.web.builders.HttpSecurity;
//import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
//import org.springframework.security.config.http.SessionCreationPolicy;
//import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
//import org.springframework.security.crypto.password.PasswordEncoder;
//import org.springframework.security.web.SecurityFilterChain;
//import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
//import org.springframework.web.cors.CorsConfiguration;
//import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
//import org.springframework.web.cors.CorsConfigurationSource;
//
//import java.util.Arrays;
//
//@Configuration
//@EnableWebSecurity
//@EnableGlobalMethodSecurity(prePostEnabled = true)
//public class WebSecurityConfig {
//
//    @Autowired
//    private UserDetailsServiceImpl userDetailsService;
//    private final AuthEntryPointJwt unauthorizedHandler;
//
//    public WebSecurityConfig(UserDetailsServiceImpl userDetailsService, AuthEntryPointJwt unauthorizedHandler) {
//        this.userDetailsService = userDetailsService;
//        this.unauthorizedHandler = unauthorizedHandler;
//    }
//
//    @Bean
//    public AuthTokenFilter authenticationJwtTokenFilter() {
//        return new AuthTokenFilter();
//    }
//
//    @Bean
//    public AuthenticationManager authenticationManager(AuthenticationConfiguration authConfig) throws Exception {
//        return authConfig.getAuthenticationManager();
//    }
//
//    @Bean
//    public PasswordEncoder passwordEncoder() {
//        return new BCryptPasswordEncoder();
//    }
//
//    @Bean
//    public CorsConfigurationSource corsConfigurationSource() {
//        CorsConfiguration corsConfig = new CorsConfiguration();
//        corsConfig.setAllowCredentials(true);
//        corsConfig.setAllowedOrigins(Arrays.asList("http://localhost:4200")); // Change this if needed
//        corsConfig.setAllowedHeaders(Arrays.asList("*"));
//        corsConfig.setAllowedMethods(Arrays.asList("*"));
//
//        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
//        source.registerCorsConfiguration("/**", corsConfig);
//        return source;
//    }
//
//    @Bean
//    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
//        http.cors(cors -> cors.configurationSource(corsConfigurationSource()))
//                .csrf(csrf -> csrf.disable())
//                .exceptionHandling(exception -> exception.authenticationEntryPoint(unauthorizedHandler))
//                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
//                .authorizeHttpRequests(auth -> auth
//                        .requestMatchers("/api/auth/**").permitAll()
////                        .requestMatchers("/api/categories/getAllCategories/**").permitAll()
////                        .requestMatchers("/api/repas/getRepasByCategorie/**").permitAll()
////                        .requestMatchers("/api/repas/getRepasById/**").permitAll()
////                        .requestMatchers("/api/repas/getAllRepas/**").permitAll()
////                        .requestMatchers("/api/commande/annuler/**").permitAll()
//                        .requestMatchers("/api/user/**").permitAll()
//
//                        .anyRequest().authenticated()
//                );
//
//        http.addFilterBefore(authenticationJwtTokenFilter(), UsernamePasswordAuthenticationFilter.class);
//
//        return http.build();
//    }
//
//
//}
package com.example.projet2024;

import com.example.projet2024.Security.Jwt.AuthEntryPointJwt;
import com.example.projet2024.Security.Jwt.AuthTokenFilter;
import com.example.projet2024.Security.Services.UserDetailsServiceImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableGlobalMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@EnableGlobalMethodSecurity(prePostEnabled = true, securedEnabled = true, jsr250Enabled = true)
public class WebSecurityConfig implements WebMvcConfigurer {

    @Autowired
    private UserDetailsServiceImpl userDetailsService;

    @Autowired
    private AuthEntryPointJwt unauthorizedHandler;

    @Bean
    public AuthTokenFilter authenticationJwtTokenFilter() {
        return new AuthTokenFilter();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authConfig) throws Exception {
        return authConfig.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Chemin ABSOLU vers le dossier uploads
        Path uploadsDir = Paths.get("uploads").toAbsolutePath().normalize();

        System.out.println("📁 Serving files from: " + uploadsDir.toString());

        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:" + uploadsDir + "/")
                .setCachePeriod(3600);
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of(
                "http://localhost:4200",           // Local development
                "http://localhost:3000",           // Alternative local port
                "http://127.0.0.1:4200",           // Local loopback
                "http://192.168.1.50:4200"         // VM access
        ));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        configuration.setAllowedHeaders(Arrays.asList(
                "Authorization",
                "Content-Type",
                "Accept",
                "X-Requested-With",
                "Cache-Control"));
        configuration.setExposedHeaders(List.of("Authorization"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(csrf -> csrf.disable())
                .exceptionHandling(exception -> exception.authenticationEntryPoint(unauthorizedHandler))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll() // Nécessaire pour CORS preflight
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers("/api/user/register").permitAll() // Autorisation explicite
                        .requestMatchers("/error").permitAll()
                        .requestMatchers("/api/files/**").permitAll()
                        .requestMatchers("/Users/serve-img/**").permitAll()
                        .requestMatchers("/Users/test-image/**").permitAll()
                        .requestMatchers("/Users/available-for-messaging").authenticated()  // ✅ MESSAGING ENDPOINT - requires authentication only
                        .requestMatchers("/Users/debug/**").permitAll()  // ✅ DEBUG ENDPOINTS - no auth required for troubleshooting
                        .requestMatchers("/Users/me").authenticated()  // ✅ Endpoint pour récupérer l'utilisateur courant (authentifié)
                        .requestMatchers("/Users/**").authenticated()  // ✅ Les autres endpoints Users nécessitent une authentification
                        .requestMatchers("/Eset/download-file/**").permitAll() // Téléchargement fichiers Eset
                        .requestMatchers(HttpMethod.GET, "/Eset/{id}/download").permitAll() // Téléchargement fichiers
                                                                                            // Eset par ID
                        .requestMatchers(HttpMethod.GET, "/Fortinet/{id}/download").permitAll() // Téléchargement
                                                                                                // fichiers Fortinet par
                                                                                                // ID
                        .requestMatchers(HttpMethod.GET, "/Palo/{id}/download").permitAll() // Téléchargement fichiers
                                                                                            // Palo par ID
                        .requestMatchers(HttpMethod.GET, "/Veeam/{id}/download").permitAll() // Téléchargement fichiers
                                                                                             // Veeam par ID
                        .requestMatchers(HttpMethod.GET, "/Proofpoint/{id}/download").permitAll() // Téléchargement
                                                                                                  // fichiers Proofpoint
                                                                                                  // par ID
                        .requestMatchers(HttpMethod.GET, "/Wallix/{id}/download").permitAll() // Téléchargement fichiers
                                                                                              // Wallix par ID
                        .requestMatchers(HttpMethod.GET, "/Rapid7/{id}/download").permitAll() // Téléchargement fichiers
                                                                                              // Rapid7 par ID
                        .requestMatchers(HttpMethod.GET, "/Crowdstrike/{id}/download").permitAll() // Téléchargement
                                                                                                   // fichiers
                                                                                                   // Crowdstrike par ID
                        .requestMatchers(HttpMethod.GET, "/VMware/{id}/download").permitAll() // Téléchargement fichiers
                                                                                              // VMware par ID
                        .requestMatchers(HttpMethod.GET, "/Splunk/{id}/download").permitAll() // Téléchargement fichiers
                                                                                              // Splunk par ID
                        .requestMatchers(HttpMethod.GET, "/OneIdentity/{id}/download").permitAll() // Téléchargement
                                                                                                   // fichiers
                                                                                                   // OneIdentity par ID
                        .requestMatchers(HttpMethod.GET, "/SecPoint/{id}/download").permitAll() // Téléchargement
                                                                                                // fichiers SecPoint par
                                                                                                // ID
                        .requestMatchers(HttpMethod.GET, "/Bitdefender/{id}/download").permitAll() // Téléchargement
                                                                                                   // fichiers
                                                                                                   // Bitdefender par ID
                        .requestMatchers(HttpMethod.GET, "/Netskope/{id}/download").permitAll() // Téléchargement
                                                                                                // fichiers Netskope par
                                                                                                // ID
                        .requestMatchers(HttpMethod.GET, "/F5/{id}/download").permitAll() // Téléchargement fichiers F5
                                                                                          // par ID
                        .requestMatchers(HttpMethod.GET, "/Fortra/{id}/download").permitAll() // Téléchargement fichiers
                                                                                              // Fortra par ID

                        .requestMatchers(HttpMethod.GET, "/SentineIOne/{id}/download").permitAll() // Téléchargement
                                                                                                   // fichiers
                                                                                                   // SentineIOne par ID
                        .requestMatchers(HttpMethod.GET, "/Alwarebytes/{id}/download").permitAll() // Téléchargement
                                                                                                   // fichiers
                                                                                                   // Alwarebytes par ID
                        .requestMatchers(HttpMethod.GET, "/Infoblox/{id}/download").permitAll() // Téléchargement
                                                                                                   // fichiers
                                                                                                   // Infoblox par ID
                        .requestMatchers(HttpMethod.GET, "/Varonis/{id}/download").permitAll() // Téléchargement
                                                                                                   // fichiers
                                                                                                   // Varonis par ID
                        .requestMatchers(HttpMethod.GET, "/MicrosoftO365/{id}/download").permitAll() // Téléchargement
                                                                                                   // fichiers
                                                                                                   // MicrosoftO365 par ID
                        .requestMatchers(HttpMethod.GET, "/Imperva/{id}/download").permitAll() // Téléchargement
                                                                                                   // fichiers
                                                                                                   // Imperva par ID
                        .requestMatchers(HttpMethod.GET, "/Cisco/{id}/download").permitAll() // Téléchargement
                                                                                                   // fichiers
                                                                                                   // Cisco par ID
                        .requestMatchers(HttpMethod.GET, "/Contrat/{id}/download").permitAll() // Téléchargement
                                                                                                   // fichiers
                                                                                                   // Contrat par ID
                        .requestMatchers(HttpMethod.GET, "/InterventionCurative/{id}/download").permitAll() // Téléchargement
                                                                                                   // fichiers
                                                                                                   // InterventionCurative par ID
                        .requestMatchers(HttpMethod.GET, "/InterventionPreventive/{id}/download").permitAll() // Téléchargement
                                                                                                   // fichiers
                                                                                                   // InterventionPreventive par ID

                        // Fichiers uploadés dans la messagerie
                        .requestMatchers("/uploads/**").permitAll()

                        // WebSocket endpoints
                        .requestMatchers("/ws/**").permitAll()

                        // Messaging API endpoints (require authentication)
                        .requestMatchers("/api/messages/**").authenticated()

                        .requestMatchers("/Eset/**").authenticated()
                        .requestMatchers("/Palo/**").authenticated()
                        .requestMatchers("/Fortinet/**").authenticated()
                        .requestMatchers("/Veeam/**").authenticated()
                        .requestMatchers("/Proofpoint/**").authenticated()
                        .requestMatchers("/Wallix/**").authenticated()
                        .requestMatchers("/Contrat/**").authenticated()
                        .requestMatchers("/InterventionCurative/**").authenticated()
                        .requestMatchers("/InterventionPreventive/**").authenticated()

                        .anyRequest().authenticated());

        http.addFilterBefore(authenticationJwtTokenFilter(), UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}