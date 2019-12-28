package org.truenewx.tnxweb.filter;

import javax.servlet.*;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;

/**
 * CORS跨域处理过滤器
 */
public class CorsFilter implements Filter {
    @Override
    public void init(FilterConfig filterConfig) throws ServletException {
    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        HttpServletResponse httpResponse = (HttpServletResponse) response;
        httpResponse.setHeader("Access-Control-Allow-Origin", "*");
        httpResponse.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
        httpResponse.setHeader("Access-Control-Allow-Headers", "x-requested-with,Authorization");
        httpResponse.setHeader("Access-Control-Allow-Credentials", "true");
        chain.doFilter(request, httpResponse);
    }

    @Override
    public void destroy() {
    }
}
